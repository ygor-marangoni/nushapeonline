// @ts-nocheck
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/jwt/verify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("PROJECT_URL");
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY");
    const jwtSecret = Deno.env.get("JWT_SECRET");

    if (!supabaseUrl || !serviceKey) {
      return new Response("Missing Supabase env vars", {
        status: 500,
        headers: corsHeaders,
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const body = await req.json().catch(() => ({}));
    const confirmCode =
      typeof body?.confirm_code === "string"
        ? body.confirm_code.trim().toUpperCase()
        : "";
    const requestedUserId =
      typeof body?.user_id === "string" ? body.user_id.trim() : "";
    const configuredCode = Deno.env.get("CONFIRM_CODE")?.trim();
    const expectedCode = (configuredCode || "NUDELETE-2026").toUpperCase();
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;
    const expectedIss = supabaseUrl
      ? `${supabaseUrl.replace(/\/$/, "")}/auth/v1`
      : "";
    let decodedPayload: Record<string, unknown> | null = null;
    try {
      const payloadPart = token.split(".")[1];
      if (payloadPart) {
        decodedPayload = JSON.parse(atob(payloadPart));
      }
    } catch (_error) {
      decodedPayload = null;
    }
    const nowEpoch = Math.floor(Date.now() / 1000);
    const fallbackSub =
      typeof decodedPayload?.sub === "string" ? decodedPayload.sub : null;
    const fallbackIss =
      typeof decodedPayload?.iss === "string" ? decodedPayload.iss : null;
    const fallbackExp =
      typeof decodedPayload?.exp === "number" ? decodedPayload.exp : null;
    const canFallback =
      Boolean(fallbackSub) &&
      (!expectedIss || fallbackIss === expectedIss) &&
      (!fallbackExp || fallbackExp > nowEpoch);

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (confirmCode && confirmCode === expectedCode) {
      if (!uuidRegex.test(requestedUserId)) {
        return new Response(
          JSON.stringify({ error: "User id inválido." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const supabaseAdmin = createClient(supabaseUrl, serviceKey);
      const { error: deleteError } =
        await supabaseAdmin.auth.admin.deleteUser(requestedUserId);

      if (deleteError) {
        return new Response(deleteError.message, {
          status: 400,
          headers: corsHeaders,
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (confirmCode && confirmCode !== expectedCode) {
      return new Response(
        JSON.stringify({ error: "Código de confirmação inválido." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!token || token.split(".").length < 3) {
      return new Response(
        JSON.stringify({
          error: "Missing or invalid token",
          hasAuthHeader: Boolean(authHeader),
          payload: decodedPayload,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUser = createClient(supabaseUrl, serviceKey);

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser(token);

    let userId = user?.id || null;
    if (userError || !userId) {
      const message = userError?.message || "Unauthorized";
      if (message.toLowerCase().includes("invalid jwt")) {
        if (jwtSecret && expectedIss) {
          try {
            let secretBytes: Uint8Array;
            try {
              const raw = atob(jwtSecret);
              secretBytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
            } catch (_error) {
              secretBytes = new TextEncoder().encode(jwtSecret);
            }
            const { payload } = await jwtVerify(token, secretBytes, {
              issuer: expectedIss,
            });
            userId =
              typeof payload.sub === "string" ? payload.sub : null;
          } catch (_verifyError) {
            if (canFallback) {
              userId = fallbackSub;
            } else {
              return new Response(
                JSON.stringify({
                  error: "Invalid JWT",
                  hasAuthHeader: Boolean(authHeader),
                  payload: decodedPayload,
                }),
                {
                  status: 401,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
              );
            }
          }
        } else if (canFallback) {
          userId = fallbackSub;
        } else {
          return new Response(
            JSON.stringify({
              error:
                "Invalid JWT (missing JWT_SECRET). Configure JWT_SECRET in Supabase secrets.",
              hasAuthHeader: Boolean(authHeader),
              payload: decodedPayload,
            }),
            {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      } else {
        return new Response(
          JSON.stringify({
            error: message,
            hasAuthHeader: Boolean(authHeader),
            payload: decodedPayload,
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          hasAuthHeader: Boolean(authHeader),
          payload: decodedPayload,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      return new Response(deleteError.message, {
        status: 400,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(String(error), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
