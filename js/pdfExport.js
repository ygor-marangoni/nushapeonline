/* PDF export for workouts (offline) */
(function (global) {
  const A4 = [595.28, 841.89];
  const FONT_URL = 'assets/fonts/arial.ttf';
  const LOGO_URL = 'assets/logo.png';
  let cachedFontBytes = null;
  let cachedLogoBytes = null;

  function normalize(value) {
    if (typeof global.norm === 'function') return global.norm(value);
    return String(value || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  }

  function slugify(text) {
    const normalized = normalize(text)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return normalized || 'treino';
  }

  function formatDate(dateInput) {
    const date = dateInput ? new Date(dateInput) : new Date();
    return date.toLocaleDateString('pt-BR');
  }

  function wrapTextByWidth(text, maxWidth, font, size) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let current = '';

    words.forEach((word) => {
      if (!current) {
        current = word;
        return;
      }
      const next = `${current} ${word}`;
      const nextWidth = font.widthOfTextAtSize(next, size);
      if (nextWidth <= maxWidth) {
        current = next;
      } else {
        lines.push(current);
        current = word;
      }
    });

    if (current) lines.push(current);
    return lines;
  }

  async function loadFontBytes() {
    if (cachedFontBytes) return cachedFontBytes;
    const response = await fetch(FONT_URL);
    if (!response.ok) throw new Error('Falha ao carregar fonte');
    const buffer = await response.arrayBuffer();
    cachedFontBytes = buffer;
    return buffer;
  }

  async function loadLogoBytes() {
    if (cachedLogoBytes) return cachedLogoBytes;
    const response = await fetch(LOGO_URL);
    if (!response.ok) throw new Error('Falha ao carregar logo');
    const buffer = await response.arrayBuffer();
    cachedLogoBytes = buffer;
    return buffer;
  }

  async function exportWorkoutPdf(workout, options = {}) {
    if (!workout) return;
    if (!global.PDFLib?.PDFDocument) {
      alert('Biblioteca de PDF indisponível.');
      return;
    }

    const { PDFDocument, rgb } = global.PDFLib;
    const doc = await PDFDocument.create();
    if (global.fontkit && doc.registerFontkit) {
      doc.registerFontkit(global.fontkit);
    }
    const fontBytes = await loadFontBytes();
    const font = await doc.embedFont(fontBytes);
    let logoImage = null;
    try {
      const logoBytes = await loadLogoBytes();
      logoImage = await doc.embedPng(logoBytes);
    } catch (error) {
      logoImage = null;
    }

    const margin = 40;
    const pageWidth = A4[0];
    const pageHeight = A4[1];
    const maxWidth = pageWidth - margin * 2;
    const footerReserve = 28;
    const bottomLimit = pageHeight - margin - footerReserve;
    const colGap = 18;
    const colWidth = (maxWidth - colGap) / 2;
    const colLeftX = margin;
    const colRightX = margin + colWidth + colGap;

    let cursorY = margin;
    let pageNumber = 0;
    let page = null;

    const toPdfY = (y) => pageHeight - y;

    const addPage = () => {
      page = doc.addPage(A4);
      pageNumber += 1;
      cursorY = margin;
    };

    const addTextAt = (text, x, y, size = 12) => {
      page.drawText(String(text || ''), {
        x,
        y: toPdfY(y),
        size,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    };

    const addDivider = () => {
      page.drawLine({
        start: { x: margin, y: toPdfY(cursorY) },
        end: { x: margin + maxWidth, y: toPdfY(cursorY) },
        thickness: 0.6,
        color: rgb(0.75, 0.75, 0.75),
      });
      cursorY += 10;
    };

    const addFooter = () => {
      return;
    };

    const ensureSpace = (height) => {
      if (cursorY + height <= bottomLimit) return;
      addFooter();
      addPage();
    };

    const addParagraph = (
      text,
      size = 12,
      spacing = 16,
      indent = 0,
      width = maxWidth,
    ) => {
      const lines = wrapTextByWidth(text, width, font, size);
      const totalHeight = lines.length * spacing;
      ensureSpace(totalHeight);
      lines.forEach((line, index) => {
        addTextAt(line, margin + indent, cursorY + index * spacing, size);
      });
      cursorY += totalHeight;
      return lines.length;
    };

    const addSectionTitle = (text) => {
      addParagraph(text, 13, 18);
    };

    const addTwoColumnRow = (leftText, rightText, size = 11, spacing = 14) => {
      const leftLines = wrapTextByWidth(leftText || '', colWidth, font, size);
      const rightLines = wrapTextByWidth(rightText || '', colWidth, font, size);
      const lineCount = Math.max(leftLines.length, rightLines.length, 1);
      ensureSpace(lineCount * spacing);
      leftLines.forEach((line, index) => {
        addTextAt(line, colLeftX, cursorY + index * spacing, size);
      });
      rightLines.forEach((line, index) => {
        addTextAt(line, colRightX, cursorY + index * spacing, size);
      });
      cursorY += lineCount * spacing;
    };

    const addHeader = () => {
      if (logoImage) {
        const titleSize = 13;
        const lineHeight = 22;
        const targetHeight = 26;
        const scale = targetHeight / logoImage.height;
        const logoWidth = logoImage.width * scale;
        const logoY = cursorY + (lineHeight - targetHeight) / 2 - 13;
        page.drawImage(logoImage, {
          x: margin - 3,
          y: toPdfY(logoY + targetHeight),
          width: logoWidth,
          height: targetHeight,
        });
        addTextAt(
          '- Plano de Treino',
          margin + logoWidth + 3,
          cursorY + (lineHeight - titleSize) / 2,
          titleSize,
        );
        cursorY += lineHeight;
      } else {
        addParagraph('Nushape - Plano de Treino', 14, 14);
      }
      cursorY += 20;
      addParagraph(`Treino: ${workout.name || 'Treino'}`, 12, 16);
      addDivider();
      cursorY += 12;
    };

    const addCompactHeader = () => {
      addParagraph(`Nushape - ${workout.name || 'Treino'}`, 11, 14);
      addDivider();
      cursorY += 18;
    };

    addPage();
    addHeader();

    const profile = options.profile || {};
    const objective =
      profile.goal || profile.objetivo || profile.objective || '';

    addSectionTitle('Resumo');
    addParagraph(
      `Divisão: ${workout.config?.division || 'Sem preferência'}`,
      11,
      16,
    );
    addParagraph(
      `Quantidade de sessões na semana: ${workout.days?.length || 0}`,
      11,
      16,
    );
    if (Number.isFinite(workout.metrics?.volumeTotal)) {
      addTwoColumnRow(
        `Volume semanal: ${workout.metrics.volumeTotal} séries`,
        objective ? `Objetivo: ${objective}` : '',
      );
    }
    if (!Number.isFinite(workout.metrics?.volumeTotal) && objective) {
      addTwoColumnRow(' ', `Objetivo: ${objective}`);
    }
    addTwoColumnRow(`Data: ${formatDate(workout.createdAt)}`, '');

    cursorY += 21;

    (workout.days || []).forEach((day, index) => {
      addSectionTitle(`Dia ${index + 1} - ${day.label}`);
      addDivider();
      if (day.exercises && day.exercises.length) {
        const tableFont = 11;
        const headerFont = 10;
        const rowSpacing = 18;
        const colNumber = 26;
        const colSeries = 74;
        const colExercise = maxWidth - colNumber - colSeries - 4;
        const seriesX = margin + colNumber + colExercise + 4;
        const headerGap = 8;

        ensureSpace(rowSpacing * 2 + headerGap * 2);
        cursorY += 6;
        addTextAt('N°', margin, cursorY, headerFont);
        addTextAt('Exercício', margin + colNumber, cursorY, headerFont);
        addTextAt('Séries/Reps', seriesX, cursorY, headerFont);
        cursorY += 10;
        addDivider();
        cursorY += 2;

        day.exercises.forEach((exercise, exerciseIndex) => {
          const repsRaw = String(exercise.reps || '').trim();
          const repsSpaced = repsRaw ? repsRaw.replace(/\s*-\s*/g, ' - ') : '';
          const prescription =
            Number.isFinite(exercise.sets) || repsSpaced
              ? `${exercise.sets || ''} x ${repsSpaced}`.trim()
              : '-';
          const nameLines = wrapTextByWidth(
            exercise.name || '',
            colExercise,
            font,
            tableFont,
          );
          if (exerciseIndex === 0) {
            ensureSpace(headerGap);
            cursorY += headerGap;
          }
          const rowHeight = Math.max(1, nameLines.length) * rowSpacing;
          ensureSpace(rowHeight);
          addTextAt(String(exerciseIndex + 1), margin, cursorY, tableFont);
          nameLines.forEach((line, idx) => {
            addTextAt(
              line,
              margin + colNumber,
              cursorY + idx * rowSpacing,
              tableFont,
            );
          });
          addTextAt(prescription, seriesX, cursorY, tableFont);
          cursorY += rowHeight;
        });
      } else {
        addParagraph('Nenhum exercício definido', 11, 15);
      }
      cursorY += 18;
    });

    addFooter();

    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().split('T')[0];
    const filename = `nushape_treino-${slugify(workout.name)}-${today}.pdf`;

    if (options.preview) {
      const previewWindow = window.open(url, '_blank');
      if (!previewWindow) {
        alert('Permita pop-ups para visualizar o PDF.');
      }
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  global.PDFExporter = {
    exportWorkoutPdf,
  };
})(window);
