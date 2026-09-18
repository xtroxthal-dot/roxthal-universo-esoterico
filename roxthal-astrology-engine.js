/* =========================================================
   RoXThal Universo Esotérico
   Motor astronómico / astrológico diario
   Versión reparada 1.1.0
   ========================================================= */

(function () {
  'use strict';

  const SRC =
    'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js';

  const VERSION = '1.1.0';

  const SIGNS = [
    'Aries',
    'Tauro',
    'Géminis',
    'Cáncer',
    'Leo',
    'Virgo',
    'Libra',
    'Escorpio',
    'Sagitario',
    'Capricornio',
    'Acuario',
    'Piscis'
  ];

  const EMOJI = [
    '♈',
    '♉',
    '♊',
    '♋',
    '♌',
    '♍',
    '♎',
    '♏',
    '♐',
    '♑',
    '♒',
    '♓'
  ];

  const BODIES = [
    ['Sol', 'Sun'],
    ['Luna', 'Moon'],
    ['Mercurio', 'Mercury'],
    ['Venus', 'Venus'],
    ['Marte', 'Mars'],
    ['Júpiter', 'Jupiter'],
    ['Saturno', 'Saturn'],
    ['Urano', 'Uranus'],
    ['Neptuno', 'Neptune'],
    ['Plutón', 'Pluto']
  ];

  const ASPECTS = [
    ['Conjunción', 0, 8],
    ['Sextil', 60, 5],
    ['Cuadratura', 90, 6],
    ['Trígono', 120, 6],
    ['Oposición', 180, 8]
  ];

  const THEMES = [
    'ordenar prioridades',
    'mejorar una conversación',
    'poner límites claros',
    'convertir una idea en un plan',
    'revisar una decisión antes de actuar',
    'cerrar una etapa pendiente',
    'dar espacio a una alternativa'
  ];

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function wrap(value) {
    let n = Number(value);

    if (!Number.isFinite(n)) {
      return 0;
    }

    n %= 360;

    if (n < 0) {
      n += 360;
    }

    return n;
  }

  function dist(a, b) {
    let d = Math.abs(
      wrap(a) - wrap(b)
    );

    if (d > 180) {
      d = 360 - d;
    }

    return d;
  }

  function signFromLongitude(longitude) {
    const lon = wrap(longitude);

    const index = Math.min(
      11,
      Math.floor(lon / 30)
    );

    return {
      i: index,
      name: SIGNS[index],
      emoji: EMOJI[index],
      degree: lon % 30
    };
  }

  function dateKey(date) {
    const parts =
      new Intl.DateTimeFormat(
        'en-CA',
        {
          timeZone:
            'America/Argentina/Buenos_Aires',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }
      )
        .formatToParts(date)
        .reduce(
          function (result, item) {
            result[item.type] = item.value;
            return result;
          },
          {}
        );

    return (
      parts.year +
      '-' +
      parts.month +
      '-' +
      parts.day
    );
  }

  function dateLabel(date) {
    return new Intl.DateTimeFormat(
      'es-AR',
      {
        timeZone:
          'America/Argentina/Buenos_Aires',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
    ).format(date);
  }

  function hash(text) {
    let h = 2166136261;

    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(
        h,
        16777619
      );
    }

    return h >>> 0;
  }

  function pick(array, seed) {
    if (!array.length) {
      return '';
    }

    return array[
      hash(seed) % array.length
    ];
  }

  /*
   * Carga Astronomy Engine.
   */
  function load() {
    return new Promise(
      function (resolve, reject) {

        /*
         * Ya cargado.
         */
        if (
          window.Astronomy &&
          typeof window.Astronomy === 'object'
        ) {
          resolve(
            window.Astronomy
          );
          return;
        }

        /*
         * Otro script ya está cargándolo.
         */
        const existing =
          document.querySelector(
            'script[data-roxthal-astro]'
          );

        if (existing) {

          existing.addEventListener(
            'load',
            function () {

              if (
                window.Astronomy
              ) {
                resolve(
                  window.Astronomy
                );
              } else {
                reject(
                  new Error(
                    'Astronomy Engine terminó de cargar pero no creó window.Astronomy.'
                  )
                );
              }

            },
            { once: true }
          );

          existing.addEventListener(
            'error',
            function () {
              reject(
                new Error(
                  'No se pudo cargar Astronomy Engine desde jsDelivr.'
                )
              );
            },
            { once: true }
          );

          return;
        }

        /*
         * Crear carga nueva.
         */
        const script =
          document.createElement(
            'script'
          );

        script.src = SRC;
        script.async = true;

        script.dataset.roxthalAstro =
          '1';

        script.onload =
          function () {

            if (
              window.Astronomy &&
              typeof window.Astronomy === 'object'
            ) {

              resolve(
                window.Astronomy
              );

            } else {

              reject(
                new Error(
                  'Astronomy Engine cargó, pero window.Astronomy no está disponible.'
                )
              );

            }
          };

        script.onerror =
          function () {

            reject(
              new Error(
                'No se pudo cargar Astronomy Engine desde jsDelivr.'
              )
            );

          };

        document.head.appendChild(
          script
        );
      }
    );
  }

  /*
   * Devuelve la longitud eclíptica geocéntrica
   * aparente del cuerpo.
   *
   * Se utilizan funciones específicas de Astronomy
   * Engine para evitar depender de estructuras
   * internas o conversiones innecesarias.
   */
  function longitude(
    Astronomy,
    body,
    date
  ) {

    if (
      !Astronomy
    ) {
      throw new Error(
        'Astronomy Engine no está disponible.'
      );
    }

    /*
     * Sol.
     */
    if (
      body === 'Sun'
    ) {

      if (
        typeof Astronomy.SunPosition !==
        'function'
      ) {
        throw new Error(
          'Astronomy.SunPosition no está disponible.'
        );
      }

      const sun =
        Astronomy.SunPosition(
          date
        );

      if (
        !sun ||
        !Number.isFinite(
          sun.elon
        )
      ) {
        throw new Error(
          'Astronomy Engine devolvió una posición solar inválida.'
        );
      }

      return {
        elon: wrap(sun.elon),
        elat: Number.isFinite(
          sun.elat
        )
          ? sun.elat
          : 0
      };
    }

    /*
     * Luna.
     */
    if (
      body === 'Moon'
    ) {

      if (
        typeof Astronomy.EclipticGeoMoon !==
        'function'
      ) {
        throw new Error(
          'Astronomy.EclipticGeoMoon no está disponible.'
        );
      }

      const moon =
        Astronomy.EclipticGeoMoon(
          date
        );

      if (
        !moon ||
        !Number.isFinite(
          moon.lon
        ) &&
        !Number.isFinite(
          moon.elon
        )
      ) {
        throw new Error(
          'Astronomy Engine devolvió una posición lunar inválida.'
        );
      }

      const moonLon =
        Number.isFinite(
          moon.elon
        )
          ? moon.elon
          : moon.lon;

      const moonLat =
        Number.isFinite(
          moon.elat
        )
          ? moon.elat
          : (
              Number.isFinite(
                moon.lat
              )
                ? moon.lat
                : 0
            );

      return {
        elon: wrap(moonLon),
        elat: moonLat
      };
    }

    /*
     * Planetas.
     */
    if (
      typeof Astronomy.EclipticLongitude !==
      'function'
    ) {
      throw new Error(
        'Astronomy.EclipticLongitude no está disponible.'
      );
    }

    if (
      !Astronomy.Body ||
      typeof Astronomy.Body[body] ===
      'undefined'
    ) {
      throw new Error(
        'No se encontró el cuerpo astronómico: ' +
        body
      );
    }

    const lon =
      Astronomy.EclipticLongitude(
        Astronomy.Body[body],
        date
      );

    if (
      !Number.isFinite(lon)
    ) {
      throw new Error(
        'Astronomy Engine devolvió una longitud inválida para ' +
        body +
        '.'
      );
    }

    return {
      elon: wrap(lon),
      elat: 0
    };
  }

  /*
   * Obtiene ascensión recta y declinación
   * para calcular constelación.
   */
  function constellation(
    Astronomy,
    body,
    date
  ) {

    /*
     * La Luna tiene su propio vector.
     */
    let vector;

    if (
      body === 'Moon'
    ) {

      if (
        typeof Astronomy.GeoMoon !==
        'function'
      ) {
        return '—';
      }

      vector =
        Astronomy.GeoMoon(
          date
        );

    } else {

      if (
        typeof Astronomy.GeoVector !==
        'function'
      ) {
        return '—';
      }

      if (
        !Astronomy.Body ||
        typeof Astronomy.Body[body] ===
        'undefined'
      ) {
        return '—';
      }

      /*
       * Astronomy Engine acepta Aberration.Corrected.
       * Para mayor compatibilidad, si el enum no está
       * disponible utilizamos true.
       */
      let aberration = true;

      if (
        Astronomy.Aberration &&
        typeof Astronomy.Aberration.Corrected !==
        'undefined'
      ) {
        aberration =
          Astronomy.Aberration.Corrected;
      }

      vector =
        Astronomy.GeoVector(
          Astronomy.Body[body],
          date,
          aberration
        );
    }

    if (
      !vector ||
      typeof Astronomy.EquatorFromVector !==
      'function' ||
      typeof Astronomy.Constellation !==
      'function'
    ) {
      return '—';
    }

    const equator =
      Astronomy.EquatorFromVector(
        vector
      );

    if (
      !equator ||
      !Number.isFinite(
        equator.ra
      ) ||
      !Number.isFinite(
        equator.dec
      )
    ) {
      return '—';
    }

    const result =
      Astronomy.Constellation(
        equator.ra,
        equator.dec
      );

    if (
      result &&
      typeof result.name ===
      'string'
    ) {
      return result.name;
    }

    if (
      result &&
      typeof result.name ===
      'undefined' &&
      typeof result.symbol ===
      'string'
    ) {
      return result.symbol;
    }

    return '—';
  }

  /*
   * Calcula posición completa.
   */
  function position(
    Astronomy,
    name,
    body,
    date
  ) {

    const current =
      longitude(
        Astronomy,
        body,
        date
      );

    const previousDate =
      new Date(
        date.getTime() -
        86400000
      );

    const previous =
      longitude(
        Astronomy,
        body,
        previousDate
      );

    let motion =
      wrap(
        current.elon -
        previous.elon
      );

    if (
      motion > 180
    ) {
      motion -= 360;
    }

    return {
      name: name,
      body: body,

      lon: current.elon,
      lat: current.elat,

      sign:
        signFromLongitude(
          current.elon
        ),

      constellation:
        constellation(
          Astronomy,
          body,
          date
        ),

      retro:
        motion < -0.02,

      motion: motion
    };
  }

  /*
   * Construye el informe.
   */
  function makeReport(
    Astronomy,
    date
  ) {

    if (
      !Astronomy
    ) {
      throw new Error(
        'Astronomy Engine no está disponible.'
      );
    }

    const positions =
      BODIES.map(
        function (item) {

          return position(
            Astronomy,
            item[0],
            item[1],
            date
          );

        }
      );

    const aspects = [];

    for (
      let i = 0;
      i < positions.length;
      i++
    ) {

      for (
        let j = i + 1;
        j < positions.length;
        j++
      ) {

        const separation =
          dist(
            positions[i].lon,
            positions[j].lon
          );

        for (
          const aspect of ASPECTS
        ) {

          const orb =
            Math.abs(
              separation -
              aspect[1]
            );

          if (
            orb <= aspect[2]
          ) {

            aspects.push({
              a:
                positions[i].name,

              b:
                positions[j].name,

              type:
                aspect[0],

              sep:
                separation,

              orb:
                orb,

              exact:
                orb < 1
            });

            break;
          }
        }
      }
    }

    aspects.sort(
      function (a, b) {
        return a.orb - b.orb;
      }
    );

    /*
     * Fase lunar.
     */
    let moonPhase = 0;

    if (
      typeof Astronomy.MoonPhase ===
      'function'
    ) {

      moonPhase =
        Astronomy.MoonPhase(
          date
        );

      if (
        !Number.isFinite(
          moonPhase
        )
      ) {
        moonPhase = 0;
      }

    }

    const key =
      dateKey(date);

    const focus =
      pick(
        THEMES,
        key +
        '|focus|' +
        VERSION
      );

    const sun =
      positions[0];

    const moon =
      positions[1];

    return {

      date: key,

      label:
        dateLabel(date),

      positions:
        positions,

      phase:
        moonPhase,

      focus:
        focus,

      aspects:
        aspects,

      summary:
        'El Sol aparece en ' +
        sun.sign.name +
        ' y la Luna en ' +
        moon.sign.name +
        '. La lectura simbólica del día ' +
        'se centra en ' +
        focus +
        '.'
    };
  }

  /*
   * Descarga el informe.
   */
  function download(
    report
  ) {

    const lines = [

      'RoXThal Universo Esotérico',

      'INFORME ASTROLÓGICO DIARIO',

      report.label,

      '',

      report.summary,

      '',

      'POSICIONES ASTRONÓMICAS'

    ];

    report.positions.forEach(
      function (item) {

        lines.push(
          item.name +
          ': ' +
          item.sign.name +
          ' ' +
          item.sign.degree.toFixed(2) +
          '° | constelación: ' +
          item.constellation +
          (
            item.retro
              ? ' | retrógrado aparente'
              : ''
          )
        );

      }
    );

    lines.push(
      '',
      'Fase lunar: ' +
      report.phase.toFixed(2) +
      '°',
      '',
      'ASPECTOS'
    );

    report.aspects
      .slice(0, 12)
      .forEach(
        function (aspect) {

          lines.push(
            aspect.a +
            ' — ' +
            aspect.type +
            ' — ' +
            aspect.b +
            ' | separación ' +
            aspect.sep.toFixed(2) +
            '° | orbe ' +
            aspect.orb.toFixed(2) +
            '°'
          );

        }
      );

    lines.push(
      '',
      'LECTURA SIMBÓLICA',

      'Foco: ' +
      report.focus,

      'Vínculos: observa comunicación, límites y expectativas.',

      'Trabajo: convierte prioridades en acciones concretas.',

      'Economía: contrasta cualquier impulso con información real.',

      'Emociones: observa el ritmo interno antes de reaccionar.',

      'Tensiones: los aspectos no implican acontecimientos inevitables.',

      'Oportunidades: utiliza la lectura como herramienta de reflexión.',

      '',

      'Las posiciones son cálculos astronómicos. ' +
      'La interpretación es astrológica, simbólica y recreativa; ' +
      'no constituye una predicción científica.'
    );

    const blob =
      new Blob(
        [
          lines.join('\n')
        ],
        {
          type:
            'text/plain;charset=utf-8'
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        'a'
      );

    link.href = url;

    link.download =
      'roxthal-informe-astrologico-' +
      report.date +
      '.txt';

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    setTimeout(
      function () {
        URL.revokeObjectURL(
          url
        );
      },
      1000
    );
  }

  /*
   * Cierra el modal.
   */
  function close() {

    const modal =
      document.getElementById(
        'rxAstroDailyModal'
      );

    if (modal) {
      modal.style.display =
        'none';
    }

    document.body.style.overflow =
      '';
  }

  /*
   * Muestra el informe.
   */
  function show(
    report
  ) {

    let modal =
      document.getElementById(
        'rxAstroDailyModal'
      );

    if (!modal) {

      modal =
        document.createElement(
          'div'
        );

      modal.id =
        'rxAstroDailyModal';

      document.body.appendChild(
        modal
      );
    }

    modal.innerHTML = `

      <div class="rxAstroBg"></div>

      <div class="rxAstroBox">

        <button
          class="rxAstroX"
          type="button"
          aria-label="Cerrar"
        >
          ×
        </button>

        <small>
          ROXTHAL · ZODÍACO
        </small>

        <h2>
          Informe astrológico diario
        </h2>

        <div class="rxAstroNotice">
          ✦ Cálculo astronómico real +
          interpretación astrológica simbólica.
        </div>

        <p>
          <strong>
            ${esc(report.label)}
          </strong>
        </p>

        <section>

          <h3>
            Síntesis
          </h3>

          <p>
            ${esc(report.summary)}
          </p>

          <p>
            <strong>Foco:</strong>
            ${esc(report.focus)}
          </p>

        </section>

        <section>

          <h3>
            🌙 Fase lunar
          </h3>

          <p>
            Ángulo de fase:
            ${report.phase.toFixed(2)}°.
          </p>

        </section>

        <section>

          <h3>
            🌌 Posiciones y constelaciones
          </h3>

          ${
            report.positions
              .map(
                function (item) {

                  return `

                    <div class="rxAstroItem">

                      <strong>
                        ${esc(item.name)}
                        ·
                        ${item.sign.emoji}
                        ${esc(item.sign.name)}
                      </strong>

                      <br>

                      ${item.sign.degree.toFixed(2)}°
                      del signo · constelación
                      astronómica:
                      ${esc(item.constellation)}

                      ${
                        item.retro
                          ? ' · movimiento retrógrado aparente'
                          : ''
                      }

                    </div>

                  `;

                }
              )
              .join('')
          }

        </section>

        <section>

          <h3>
            ✦ Aspectos principales
          </h3>

          ${
            report.aspects.length

              ?

              report.aspects
                .slice(0, 10)
                .map(
                  function (aspect) {

                    return `

                      <div class="rxAstroItem">

                        <strong>
                          ${esc(aspect.a)}
                          ·
                          ${esc(aspect.type)}
                          ·
                          ${esc(aspect.b)}
                        </strong>

                        <br>

                        Separación
                        ${aspect.sep.toFixed(2)}°
                        · orbe
                        ${aspect.orb.toFixed(2)}°

                        ${
                          aspect.exact
                            ? ' · muy próximo a exactitud'
                            : ''
                        }

                      </div>

                    `;

                  }
                )
                .join('')

              :

              '<p>No se detectaron aspectos dentro de los orbes configurados.</p>'
          }

        </section>

        <section>

          <h3>
            Lectura por áreas
          </h3>

          <div class="rxAstroItem">

            <strong>
              ❤️ Vínculos
            </strong>

            <p>
              Observa comunicación, límites y expectativas
              sin convertir la simbología en una certeza.
            </p>

          </div>

          <div class="rxAstroItem">

            <strong>
              💼 Trabajo y proyectos
            </strong>

            <p>
              Conviene traducir cualquier inspiración
              en acciones verificables y prioridades concretas.
            </p>

          </div>

          <div class="rxAstroItem">

            <strong>
              💰 Economía
            </strong>

            <p>
              Usa la lectura para revisar prioridades;
              las decisiones económicas deben apoyarse
              en información real.
            </p>

          </div>

          <div class="rxAstroItem">

            <strong>
              🌙 Mundo emocional
            </strong>

            <p>
              La Luna se utiliza como símbolo para observar
              sensibilidad, necesidades y ritmos internos.
            </p>

          </div>

          <div class="rxAstroItem">

            <strong>
              ⚠️ Tensiones
            </strong>

            <p>
              Un aspecto tenso no significa que vaya a
              ocurrir un acontecimiento determinado.
            </p>

          </div>

          <div class="rxAstroItem">

            <strong>
              ✨ Oportunidades
            </strong>

            <p>
              Los aspectos armónicos pueden utilizarse
              como marco de reflexión sobre recursos
              y cooperación.
            </p>

          </div>

        </section>

        <section>

          <h3>
            Nota
          </h3>

          <p>
            Las posiciones y constelaciones proceden de
            un cálculo astronómico. La interpretación es
            astrológica, simbólica y recreativa; no es una
            predicción científica ni garantiza acontecimientos futuros.
          </p>

        </section>

        <div class="rxAstroActions">

          <button
            id="rxAstroDownload"
            type="button"
          >
            ⬇ Descargar
          </button>

          <button
            id="rxAstroShare"
            type="button"
          >
            ↗ Compartir
          </button>

          <button
            id="rxAstroClose"
            type="button"
          >
            Cerrar
          </button>

        </div>

      </div>
    `;

    modal.style.display =
      'block';

    const closeButton =
      modal.querySelector(
        '.rxAstroX'
      );

    const closeFooter =
      modal.querySelector(
        '#rxAstroClose'
      );

    const downloadButton =
      modal.querySelector(
        '#rxAstroDownload'
      );

    const shareButton =
      modal.querySelector(
        '#rxAstroShare'
      );

    const background =
      modal.querySelector(
        '.rxAstroBg'
      );

    if (closeButton) {
      closeButton.onclick =
        close;
    }

    if (closeFooter) {
      closeFooter.onclick =
        close;
    }

    if (background) {
      background.onclick =
        close;
    }

    if (downloadButton) {
      downloadButton.onclick =
        function () {
          download(report);
        };
    }

    if (shareButton) {

      shareButton.onclick =
        function () {

          const text =
            report.label +
            '\n' +
            report.summary +
            '\nFoco: ' +
            report.focus;

          if (
            navigator.share
          ) {

            navigator.share({
              title:
                'RoXThal — Informe astrológico',
              text:
                text
            }).catch(
              function () {}
            );

          } else if (
            navigator.clipboard
          ) {

            navigator.clipboard
              .writeText(
                text
              )
              .then(
                function () {
                  alert(
                    'Resumen copiado.'
                  );
                }
              )
              .catch(
                function () {
                  alert(
                    'No se pudo copiar el resumen.'
                  );
                }
              );

          } else {

            alert(
              text
            );

          }
        };
    }

    document.body.style.overflow =
      'hidden';
  }

  /*
   * Genera el informe diario.
   */
  async function daily() {

    const Astronomy =
      await load();

    if (
      !Astronomy
    ) {
      throw new Error(
        'Astronomy Engine no está disponible.'
      );
    }

    const report =
      makeReport(
        Astronomy,
        new Date()
      );

    show(
      report
    );

    return report;
  }

  /*
   * CSS del módulo.
   */
  const css =
    document.createElement(
      'style'
    );

  css.textContent = `

    #rxAstroDailyModal{
      position:fixed;
      inset:0;
      z-index:100001;
    }

    #rxAstroDailyModal .rxAstroBg{
      position:absolute;
      inset:0;
      background:rgba(0,0,0,.86);
      backdrop-filter:blur(7px);
    }

    #rxAstroDailyModal .rxAstroBox{
      position:relative;
      width:min(
        760px,
        calc(100% - 14px)
      );

      max-height:
        calc(100vh - 14px);

      overflow:auto;

      margin:7px auto;

      padding:
        22px
        15px
        28px;

      border:
        1px solid
        rgba(215,173,85,.35);

      border-radius:22px;

      background:#110d19;

      color:#f5f0e7;

      box-shadow:
        0 30px
        100px
        rgba(0,0,0,.7);

      box-sizing:border-box;
    }

    #rxAstroDailyModal .rxAstroX{
      position:absolute;

      right:9px;
      top:9px;

      width:40px;
      height:40px;

      border-radius:50%;

      border:
        1px solid
        rgba(215,173,85,.25);

      background:#21182b;

      color:#f1d78b;

      font-size:27px;

      cursor:pointer;
    }

    #rxAstroDailyModal .rxAstroBox small{
      color:#d7ad55;

      font-weight:800;

      letter-spacing:2px;
    }

    #rxAstroDailyModal .rxAstroBox h2{
      color:#f1d78b;

      margin:
        7px
        45px
        5px
        0;
    }

    #rxAstroDailyModal .rxAstroBox p{
      color:#c0b6c4;

      font-size:13px;

      line-height:1.6;
    }

    #rxAstroDailyModal .rxAstroNotice{
      margin:
        14px
        0;

      padding:11px;

      border:
        1px solid
        rgba(215,173,85,.22);

      border-radius:12px;

      background:
        rgba(215,173,85,.06);

      font-size:12px;
    }

    #rxAstroDailyModal .rxAstroBox section{
      margin-top:17px;

      padding-top:14px;

      border-top:
        1px solid
        rgba(215,173,85,.13);
    }

    #rxAstroDailyModal .rxAstroBox h3{
      color:#f1d78b;

      font-size:16px;

      margin-bottom:8px;
    }

    #rxAstroDailyModal .rxAstroItem{
      padding:10px 0;

      border-top:
        1px solid
        rgba(215,173,85,.08);

      font-size:13px;

      line-height:1.5;
    }

    #rxAstroDailyModal .rxAstroItem strong{
      color:#fff;
    }

    #rxAstroDailyModal .rxAstroActions{
      display:flex;

      flex-wrap:wrap;

      gap:8px;

      margin-top:20px;
    }

    #rxAstroDailyModal .rxAstroActions button{
      flex:1;

      padding:12px;

      border-radius:12px;

      border:
        1px solid
        rgba(215,173,85,.3);

      background:#21182b;

      color:#f5f0e7;

      font-weight:800;

      cursor:pointer;
    }

    #rxAstroDailyModal
    .rxAstroActions
    #rxAstroDownload{

      background:
        linear-gradient(
          135deg,
          #b88c37,
          #e0bd69
        );

      color:#17100a;
    }

    @media(max-width:480px){

      #rxAstroDailyModal .rxAstroBox{
        padding:
          20px
          12px
          24px;
      }

      #rxAstroDailyModal
      .rxAstroActions{

        display:grid;

      }

      #rxAstroDailyModal
      .rxAstroActions
      button{

        width:100%;

      }

    }

  `;

  document.head.appendChild(
    css
  );

  /*
   * Conserva cualquier abrirModulo
   * anterior y toma únicamente
   * el control de Zodíaco.
   */
  const previous =
    window.abrirModulo;

  window.abrirModulo =
    function (nombre) {

      if (
        nombre ===
        'Zodíaco'
      ) {

        daily()
          .catch(
            function (error) {

              console.error(
                'RoXThal Astro:',
                error
              );

              const message =
                error &&
                error.message
                  ? error.message
                  : String(error);

              if (
                typeof window.mostrarAviso ===
                'function'
              ) {

                window.mostrarAviso(
                  'Error del motor astronómico: ' +
                  message
                );

              } else {

                alert(
                  'Error del motor astronómico: ' +
                  message
                );

              }

            }
          );

        return;
      }

      if (
        typeof previous ===
        'function'
      ) {

        return previous.apply(
          this,
          arguments
        );

      }

    };

  /*
   * API pública.
   */
  window.RoXThalAstro = {

    version:
      VERSION,

    daily:
      daily,

    load:
      load

  };

  console.log(
    'RoXThal Astro ' +
    VERSION +
    ' cargado correctamente.'
  );

})();
