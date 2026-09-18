/* RoXThal Universo Esotérico — Motor astronómico/astrológico diario v1.0 */
(function(){
'use strict';

const SRC='https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js';
const VERSION='1.0.0';

const SIGNS=[
  'Aries','Tauro','Géminis','Cáncer','Leo','Virgo',
  'Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'
];

const EMOJI=[
  '♈','♉','♊','♋','♌','♍',
  '♎','♏','♐','♑','♒','♓'
];

const BODIES=[
  ['Sol','Sun'],
  ['Luna','Moon'],
  ['Mercurio','Mercury'],
  ['Venus','Venus'],
  ['Marte','Mars'],
  ['Júpiter','Jupiter'],
  ['Saturno','Saturn'],
  ['Urano','Uranus'],
  ['Neptuno','Neptune'],
  ['Plutón','Pluto']
];

const ASPECTS=[
  ['Conjunción',0,8],
  ['Sextil',60,5],
  ['Cuadratura',90,6],
  ['Trígono',120,6],
  ['Oposición',180,8]
];

const THEMES=[
  'ordenar prioridades',
  'mejorar una conversación',
  'poner límites claros',
  'convertir una idea en un plan',
  'revisar una decisión antes de actuar',
  'cerrar una etapa pendiente',
  'dar espacio a una alternativa'
];

function esc(v){
  return String(v??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

function wrap(x){
  x%=360;
  return x<0?x+360:x;
}

function dist(a,b){
  let d=Math.abs(wrap(a)-wrap(b));
  return d>180?360-d:d;
}

function sign(lon){
  const i=Math.floor(wrap(lon)/30);
  return {
    i,
    name:SIGNS[i],
    emoji:EMOJI[i],
    degree:wrap(lon)%30
  };
}

function dateKey(d){
  const p=new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone:'America/Argentina/Buenos_Aires',
      year:'numeric',
      month:'2-digit',
      day:'2-digit'
    }
  )
  .formatToParts(d)
  .reduce(
    (o,x)=>(o[x.type]=x.value,o),
    {}
  );

  return `${p.year}-${p.month}-${p.day}`;
}

function dateLabel(d){
  return new Intl.DateTimeFormat(
    'es-AR',
    {
      timeZone:'America/Argentina/Buenos_Aires',
      weekday:'long',
      year:'numeric',
      month:'long',
      day:'numeric'
    }
  ).format(d);
}

function hash(s){
  let h=2166136261;

  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619);
  }

  return h>>>0;
}

function pick(a,s){
  return a[hash(s)%a.length];
}

function load(){
  return new Promise(function(resolve,reject){

    if(window.Astronomy){
      resolve(window.Astronomy);
      return;
    }

    const old=document.querySelector(
      'script[data-roxthal-astro]'
    );

    if(old){

      old.addEventListener(
        'load',
        ()=>resolve(window.Astronomy),
        {once:true}
      );

      old.addEventListener(
        'error',
        reject,
        {once:true}
      );

      return;
    }

    const s=document.createElement('script');

    s.src=SRC;
    s.async=true;
    s.dataset.roxthalAstro='1';

    s.onload=()=>{
      resolve(window.Astronomy);
    };

    s.onerror=()=>{
      reject(
        new Error(
          'No se pudo cargar Astronomy Engine.'
        )
      );
    };

    document.head.appendChild(s);
  });
}

function geo(A,body,d){

  if(body==='Sun'){
    return A.SunPosition(d);
  }

  if(body==='Moon'){
    return A.EclipticGeoMoon(d);
  }

  return A.Ecliptic(
    A.GeoVector(
      A.Body[body],
      d,
      A.Aberration.Corrected
    )
  );
}

function pos(A,name,body,d){

  const e=geo(A,body,d);

  let v;

  if(body==='Moon'){
    v=A.GeoMoon(d);
  }else{
    v=A.GeoVector(
      A.Body[body],
      d,
      A.Aberration.Corrected
    );
  }

  const q=A.EquatorFromVector(v);

  const c=A.Constellation(
    q.ra,
    q.dec
  );

  const prev=new Date(
    d.getTime()-86400000
  );

  const pe=geo(
    A,
    body,
    prev
  );

  let delta=
    wrap(e.elon-pe.elon);

  if(delta>180){
    delta-=360;
  }

  return {
    name,
    body,
    lon:e.elon,
    lat:e.elat,
    sign:sign(e.elon),
    constellation:c.name,
    retro:delta<-.02,
    motion:delta
  };
}

function makeReport(A,d){

  const p=BODIES.map(
    x=>pos(
      A,
      x[0],
      x[1],
      d
    )
  );

  const asp=[];

  for(let i=0;i<p.length;i++){

    for(let j=i+1;j<p.length;j++){

      const sep=dist(
        p[i].lon,
        p[j].lon
      );

      for(const a of ASPECTS){

        const orb=
          Math.abs(
            sep-a[1]
          );

        if(orb<=a[2]){

          asp.push({
            a:p[i].name,
            b:p[j].name,
            type:a[0],
            sep,
            orb,
            exact:orb<1
          });

          break;
        }
      }
    }
  }

  asp.sort(
    (a,b)=>a.orb-b.orb
  );

  const moon=A.MoonPhase(d);
  const key=dateKey(d);

  const focus=pick(
    THEMES,
    key+'|focus|'+VERSION
  );

  const sun=p[0];
  const m=p[1];

  return {
    date:key,
    label:dateLabel(d),
    positions:p,
    phase:moon,
    focus,
    aspects:asp,

    summary:
      `El Sol aparece en ${sun.sign.name} y `+
      `la Luna en ${m.sign.name}. `+
      `La lectura simbólica del día se centra en `+
      `${focus}.`
  };
}

function download(r){

  const lines=[
    'RoXThal Universo Esotérico',
    'INFORME ASTROLÓGICO DIARIO',
    r.label,
    '',
    r.summary,
    '',
    'POSICIONES ASTRONÓMICAS'
  ];

  r.positions.forEach(function(p){

    lines.push(
      `${p.name}: `+
      `${p.sign.name} `+
      `${p.sign.degree.toFixed(2)}° | `+
      `constelación: ${p.constellation}`+
      `${p.retro?' | retrógrado aparente':''}`
    );

  });

  lines.push(
    '',
    `Fase lunar: ${r.phase.toFixed(2)}°`,
    '',
    'ASPECTOS'
  );

  r.aspects
    .slice(0,12)
    .forEach(function(a){

      lines.push(
        `${a.a} — ${a.type} — ${a.b} | `+
        `separación ${a.sep.toFixed(2)}° | `+
        `orbe ${a.orb.toFixed(2)}°`
      );

    });

  lines.push(
    '',
    'LECTURA SIMBÓLICA',
    `Foco: ${r.focus}`,

    'Vínculos: observa comunicación, límites y expectativas.',

    'Trabajo: convierte prioridades en acciones concretas.',

    'Economía: contrasta cualquier impulso con información real.',

    'Emociones: observa el ritmo interno antes de reaccionar.',

    'Tensiones: los aspectos no implican acontecimientos inevitables.',

    'Oportunidades: utiliza la lectura como herramienta de reflexión.',

    '',

    'Las posiciones son cálculos astronómicos. '+
    'La interpretación es astrológica, simbólica y recreativa; '+
    'no constituye una predicción científica.'
  );

  const blob=new Blob(
    [lines.join('\n')],
    {
      type:'text/plain;charset=utf-8'
    }
  );

  const u=URL.createObjectURL(blob);

  const a=document.createElement('a');

  a.href=u;

  a.download=
    `roxthal-informe-astrologico-${r.date}.txt`;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(
    ()=>URL.revokeObjectURL(u),
    1000
  );
}

function show(r){

  let m=
    document.getElementById(
      'rxAstroDailyModal'
    );

  if(!m){

    m=document.createElement('div');

    m.id='rxAstroDailyModal';

    document.body.appendChild(m);
  }

  m.innerHTML=`

    <div class="rxAstroBg"></div>

    <div class="rxAstroBox">

      <button class="rxAstroX">
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
          ${esc(r.label)}
        </strong>
      </p>

      <section>

        <h3>
          Síntesis
        </h3>

        <p>
          ${esc(r.summary)}
        </p>

        <p>
          <strong>Foco:</strong>
          ${esc(r.focus)}
        </p>

      </section>

      <section>

        <h3>
          🌙 Fase lunar
        </h3>

        <p>
          Ángulo de fase:
          ${r.phase.toFixed(2)}°.
        </p>

      </section>

      <section>

        <h3>
          🌌 Posiciones y constelaciones
        </h3>

        ${
          r.positions.map(
            p=>`

              <div class="rxAstroItem">

                <strong>
                  ${p.name} ·
                  ${p.sign.emoji}
                  ${p.sign.name}
                </strong>

                <br>

                ${p.sign.degree.toFixed(2)}°
                del signo · constelación
                astronómica:
                ${esc(p.constellation)}

                ${
                  p.retro
                    ? ' · movimiento retrógrado aparente'
                    : ''
                }

              </div>

            `
          ).join('')
        }

      </section>

      <section>

        <h3>
          ✦ Aspectos principales
        </h3>

        ${
          r.aspects.length

          ?

          r.aspects
            .slice(0,10)
            .map(
              a=>`

                <div class="rxAstroItem">

                  <strong>
                    ${esc(a.a)}
                    ·
                    ${esc(a.type)}
                    ·
                    ${esc(a.b)}
                  </strong>

                  <br>

                  Separación
                  ${a.sep.toFixed(2)}°
                  · orbe
                  ${a.orb.toFixed(2)}°

                  ${
                    a.exact
                      ? ' · muy próximo a exactitud'
                      : ''
                  }

                </div>

              `
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

        <button id="rxAstroDownload">
          ⬇ Descargar
        </button>

        <button id="rxAstroShare">
          ↗ Compartir
        </button>

        <button id="rxAstroClose">
          Cerrar
        </button>

      </div>

    </div>
  `;

  m.style.display='block';

  m.querySelector(
    '.rxAstroX'
  ).onclick=close;

  m.querySelector(
    '#rxAstroClose'
  ).onclick=close;

  m.querySelector(
    '#rxAstroDownload'
  ).onclick=()=>download(r);

  m.querySelector(
    '#rxAstroShare'
  ).onclick=()=>{

    const t=
      `${r.label}\n`+
      `${r.summary}\n`+
      `Foco: ${r.focus}`;

    if(navigator.share){

      navigator.share({
        title:
          'RoXThal — Informe astrológico',
        text:t
      }).catch(()=>{});

    }else if(navigator.clipboard){

      navigator.clipboard
        .writeText(t)
        .then(
          ()=>alert('Resumen copiado.')
        );
    }
  };

  m.querySelector(
    '.rxAstroBg'
  ).onclick=close;

  document.body.style.overflow='hidden';
}

function close(){

  const m=
    document.getElementById(
      'rxAstroDailyModal'
    );

  if(m){
    m.style.display='none';
  }

  document.body.style.overflow='';
}

async function daily(){

  const A=await load();

  const r=makeReport(
    A,
    new Date()
  );

  show(r);

  return r;
}

const css=
document.createElement('style');

css.textContent=`

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

.rxAstroBox{
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
}

.rxAstroX{
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
}

.rxAstroBox small{
  color:#d7ad55;

  font-weight:800;

  letter-spacing:2px;
}

.rxAstroBox h2{
  color:#f1d78b;

  margin:
    7px
    45px
    5px
    0;
}

.rxAstroBox p{
  color:#c0b6c4;

  font-size:13px;

  line-height:1.6;
}

.rxAstroNotice{
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

.rxAstroBox section{
  margin-top:17px;

  padding-top:14px;

  border-top:
    1px solid
    rgba(215,173,85,.13);
}

.rxAstroBox h3{
  color:#f1d78b;

  font-size:16px;

  margin-bottom:8px;
}

.rxAstroItem{
  padding:10px 0;

  border-top:
    1px solid
    rgba(215,173,85,.08);

  font-size:13px;

  line-height:1.5;
}

.rxAstroItem strong{
  color:#fff;
}

.rxAstroActions{
  display:flex;

  flex-wrap:wrap;

  gap:8px;

  margin-top:20px;
}

.rxAstroActions button{
  flex:1;

  padding:12px;

  border-radius:12px;

  border:
    1px solid
    rgba(215,173,85,.3);

  background:#21182b;

  color:#f5f0e7;

  font-weight:800;
}

.rxAstroActions #rxAstroDownload{
  background:
    linear-gradient(
      135deg,
      #b88c37,
      #e0bd69
    );

  color:#17100a;
}

@media(max-width:480px){

  .rxAstroBox{
    padding:
      20px
      12px
      24px;
  }

  .rxAstroActions{
    display:grid;
  }

  .rxAstroActions button{
    width:100%;
  }
}
`;

document.head.appendChild(css);

const previous=
  window.abrirModulo;

window.abrirModulo=
function(nombre){

  if(nombre==='Zodíaco'){

    daily()
      .catch(function(e){

        console.error(e);

        if(
          typeof window.mostrarAviso===
          'function'
        ){

          window.mostrarAviso(
            'No se pudo cargar el motor astronómico. Comprueba tu conexión.'
          );

        }else{

          alert(
            'No se pudo cargar el motor astronómico.'
          );
        }

      });

    return;
  }

  if(
    typeof previous===
    'function'
  ){

    return previous.apply(
      this,
      arguments
    );
  }
};

window.RoXThalAstro={
  version:VERSION,
  daily,
  load
};

})();
