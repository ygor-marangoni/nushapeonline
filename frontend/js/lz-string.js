/* LZ-String 1.4.4 (MIT) - minimal build for compressToBase64/decompressFromBase64 */
(function (global) {
  const f = String.fromCharCode;
  const keyStrBase64 =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  function getBaseValue(alphabet, character) {
    return alphabet.indexOf(character);
  }

  function compress(uncompressed) {
    if (uncompressed == null) return '';
    let i;
    let value;
    const context_dictionary = {};
    const context_dictionaryToCreate = {};
    let context_c = '';
    let context_wc = '';
    let context_w = '';
    let context_enlargeIn = 2;
    let context_dictSize = 3;
    let context_numBits = 2;
    let context_data = [];
    let context_data_val = 0;
    let context_data_position = 0;

    for (let ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed.charAt(ii);
      if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }

      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
        context_w = context_wc;
      } else {
        if (
          Object.prototype.hasOwnProperty.call(
            context_dictionaryToCreate,
            context_w,
          )
        ) {
          if (context_w.charCodeAt(0) < 256) {
            for (i = 0; i < context_numBits; i += 1) {
              context_data_val = context_data_val << 1;
              if (context_data_position === 15) {
                context_data_position = 0;
                context_data.push(f(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position += 1;
              }
            }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 8; i += 1) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position === 15) {
                context_data_position = 0;
                context_data.push(f(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position += 1;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i = 0; i < context_numBits; i += 1) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position === 15) {
                context_data_position = 0;
                context_data.push(f(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position += 1;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 16; i += 1) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position === 15) {
                context_data_position = 0;
                context_data.push(f(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position += 1;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn -= 1;
          if (context_enlargeIn === 0) {
            context_enlargeIn = 2 ** context_numBits;
            context_numBits += 1;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i = 0; i < context_numBits; i += 1) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position === 15) {
              context_data_position = 0;
              context_data.push(f(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position += 1;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn -= 1;
        if (context_enlargeIn === 0) {
          context_enlargeIn = 2 ** context_numBits;
          context_numBits += 1;
        }
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }

    if (context_w !== '') {
      if (
        Object.prototype.hasOwnProperty.call(
          context_dictionaryToCreate,
          context_w,
        )
      ) {
        if (context_w.charCodeAt(0) < 256) {
          for (i = 0; i < context_numBits; i += 1) {
            context_data_val = context_data_val << 1;
            if (context_data_position === 15) {
              context_data_position = 0;
              context_data.push(f(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position += 1;
            }
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 8; i += 1) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position === 15) {
              context_data_position = 0;
              context_data.push(f(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position += 1;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i = 0; i < context_numBits; i += 1) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position === 15) {
              context_data_position = 0;
              context_data.push(f(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position += 1;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 16; i += 1) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position === 15) {
              context_data_position = 0;
              context_data.push(f(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position += 1;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn -= 1;
        if (context_enlargeIn === 0) {
          context_enlargeIn = 2 ** context_numBits;
          context_numBits += 1;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i = 0; i < context_numBits; i += 1) {
          context_data_val = (context_data_val << 1) | (value & 1);
          if (context_data_position === 15) {
            context_data_position = 0;
            context_data.push(f(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position += 1;
          }
          value = value >> 1;
        }
      }
      context_enlargeIn -= 1;
      if (context_enlargeIn === 0) {
        context_enlargeIn = 2 ** context_numBits;
        context_numBits += 1;
      }
    }

    value = 2;
    for (i = 0; i < context_numBits; i += 1) {
      context_data_val = (context_data_val << 1) | (value & 1);
      if (context_data_position === 15) {
        context_data_position = 0;
        context_data.push(f(context_data_val));
        context_data_val = 0;
      } else {
        context_data_position += 1;
      }
      value = value >> 1;
    }

    while (true) {
      context_data_val = context_data_val << 1;
      if (context_data_position === 15) {
        context_data.push(f(context_data_val));
        break;
      } else context_data_position += 1;
    }
    return context_data.join('');
  }

  function decompress(compressed) {
    if (compressed == null) return '';
    if (compressed === '') return '';
    let dictionary = [];
    let next;
    let enlargeIn = 4;
    let dictSize = 4;
    let numBits = 3;
    let entry = '';
    const result = [];
    let i;
    let w;
    let bits;
    let resb;
    let maxpower;
    let power;
    const data = { string: compressed, val: compressed.charCodeAt(0), pos: 32768, index: 1 };

    for (i = 0; i < 3; i += 1) dictionary[i] = i;

    bits = 0;
    maxpower = 2 ** 2;
    power = 1;
    while (power !== maxpower) {
      resb = data.val & data.pos;
      data.pos >>= 1;
      if (data.pos === 0) {
        data.pos = 32768;
        data.val = data.string.charCodeAt(data.index++);
      }
      bits |= (resb > 0 ? 1 : 0) * power;
      power <<= 1;
    }

    switch (bits) {
      case 0:
        bits = 0;
        maxpower = 2 ** 8;
        power = 1;
        while (power !== maxpower) {
          resb = data.val & data.pos;
          data.pos >>= 1;
          if (data.pos === 0) {
            data.pos = 32768;
            data.val = data.string.charCodeAt(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        next = f(bits);
        break;
      case 1:
        bits = 0;
        maxpower = 2 ** 16;
        power = 1;
        while (power !== maxpower) {
          resb = data.val & data.pos;
          data.pos >>= 1;
          if (data.pos === 0) {
            data.pos = 32768;
            data.val = data.string.charCodeAt(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        next = f(bits);
        break;
      case 2:
        return '';
      default:
        next = '';
        break;
    }
    dictionary[3] = next;
    w = next;
    result.push(next);

    while (true) {
      if (data.index > data.string.length) return '';

      bits = 0;
      maxpower = 2 ** numBits;
      power = 1;
      while (power !== maxpower) {
        resb = data.val & data.pos;
        data.pos >>= 1;
        if (data.pos === 0) {
          data.pos = 32768;
          data.val = data.string.charCodeAt(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (bits) {
        case 0:
          bits = 0;
          maxpower = 2 ** 8;
          power = 1;
          while (power !== maxpower) {
            resb = data.val & data.pos;
            data.pos >>= 1;
            if (data.pos === 0) {
              data.pos = 32768;
              data.val = data.string.charCodeAt(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = f(bits);
          bits = dictSize - 1;
          enlargeIn -= 1;
          break;
        case 1:
          bits = 0;
          maxpower = 2 ** 16;
          power = 1;
          while (power !== maxpower) {
            resb = data.val & data.pos;
            data.pos >>= 1;
            if (data.pos === 0) {
              data.pos = 32768;
              data.val = data.string.charCodeAt(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = f(bits);
          bits = dictSize - 1;
          enlargeIn -= 1;
          break;
        case 2:
          return result.join('');
        default:
          break;
      }

      if (enlargeIn === 0) {
        enlargeIn = 2 ** numBits;
        numBits += 1;
      }

      if (dictionary[bits]) {
        entry = dictionary[bits];
      } else if (bits === dictSize) {
        entry = w + w.charAt(0);
      } else {
        return '';
      }
      result.push(entry);

      dictionary[dictSize++] = w + entry.charAt(0);
      enlargeIn -= 1;
      w = entry;

      if (enlargeIn === 0) {
        enlargeIn = 2 ** numBits;
        numBits += 1;
      }
    }
  }

  function compressToBase64(input) {
    if (input == null) return '';
    const res = compress(input);
    let i;
    let output = '';
    for (i = 0; i < res.length * 2; i += 3) {
      const chr1 = res.charCodeAt(i / 2);
      const chr2 = res.charCodeAt(i / 2 + 1);
      const chr3 = res.charCodeAt(i / 2 + 2);
      const enc1 = chr1 >> 2;
      const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      let enc4 = chr3 & 63;
      if (Number.isNaN(chr2)) {
        enc3 = 64;
        enc4 = 64;
      } else if (Number.isNaN(chr3)) {
        enc4 = 64;
      }
      output =
        output +
        keyStrBase64.charAt(enc1) +
        keyStrBase64.charAt(enc2) +
        keyStrBase64.charAt(enc3) +
        keyStrBase64.charAt(enc4);
    }
    return output;
  }

  function decompressFromBase64(input) {
    if (input == null || input === '') return '';
    let output = '';
    let chr1;
    let chr2;
    let chr3;
    let enc1;
    let enc2;
    let enc3;
    let enc4;
    let i = 0;
    input = input.replace(/[^A-Za-z0-9+/=]/g, '');
    while (i < input.length) {
      enc1 = getBaseValue(keyStrBase64, input.charAt(i++));
      enc2 = getBaseValue(keyStrBase64, input.charAt(i++));
      enc3 = getBaseValue(keyStrBase64, input.charAt(i++));
      enc4 = getBaseValue(keyStrBase64, input.charAt(i++));
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
      output += f(chr1);
      if (enc3 !== 64) output += f(chr2);
      if (enc4 !== 64) output += f(chr3);
    }
    return decompress(output);
  }

  global.LZString = {
    compressToBase64,
    decompressFromBase64,
  };
})(window);
