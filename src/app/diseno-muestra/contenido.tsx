import { ACENTO_RUBRO, NOMBRE_RUBRO, RUBROS_PREMIUM, TEXTO_PREMIUM, FONDO_PREMIUM, claseRubro } from "@/lib/premium/rubros";
import { Anillo, Bento, BentoCelda, Boton, Cifra, Encabezado, FondoVivo, Medidor, Pastilla, SaludoJarvis, Tarjeta, VerMas } from "@/components/premium";

/**
 * Muestra de la fundación visual (22/11): todos los componentes premium con datos sintéticos, y una
 * pantalla «Hoy» armada en bento. No reemplaza ninguna pantalla ni está en el menú: sirve para
 * revisar el diseño antes de aplicarlo.
 */
const CONSULTAS = [
  { rubro: RUBROS_PREMIUM[0], valor: 12, meta: 20, contexto: "+4 que ayer" },
  { rubro: RUBROS_PREMIUM[1], valor: 8, meta: 10, contexto: "+1 que ayer" },
  { rubro: RUBROS_PREMIUM[2], valor: 5, meta: 12, contexto: "igual que ayer" },
  { rubro: RUBROS_PREMIUM[3], valor: 21, meta: 20, contexto: "meta cumplida" },
] as const;

const IconoActualizar = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 10a6 6 0 1 1-1.8-4.3M16 3.5v3.2h-3.2" />
  </svg>
);
const IconoAjustes = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h8M15 6h1M4 14h1M8 14h8" />
    <circle cx="13.5" cy="6" r="1.8" />
    <circle cx="6.5" cy="14" r="1.8" />
  </svg>
);
const IconoCampana = (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 14V9a5 5 0 0 1 10 0v5l1.5 1.5h-13L5 14ZM8.5 17.5h3" />
  </svg>
);

function CeldaAnillo({ i }: { i: number }) {
  const c = CONSULTAS[i];
  return (
    <BentoCelda columnas={4} columnasMedio={3}>
      <Tarjeta rubro={c.rubro} relieve aparecer={i < 2 ? i + 1 : i + 2}>
        <div className="pm-anillo-celda">
          <Anillo valor={c.valor} meta={c.meta} rubro={c.rubro} tamano="grande" unidad="consultas hoy" retrasoMs={i * 50} />
          <span className="pm-anillo-tarjeta__etiqueta">{NOMBRE_RUBRO[c.rubro]}</span>
          <span className="pm-anillo-tarjeta__contexto">{c.contexto}</span>
        </div>
      </Tarjeta>
    </BentoCelda>
  );
}

export function ContenidoMuestra() {
  return (
    <div className="pm-lienzo">
      <FondoVivo />
      <main id="contenido" className="pm-pagina">
        <Encabezado titulo="Hoy" subtitulo="Una pantalla armada en bento con la nueva base visual y datos de prueba." rubro="juridico">
          <Boton soloIcono etiqueta="Actualizar" icono={IconoActualizar} />
          <Boton soloIcono etiqueta="Avisos" icono={IconoCampana} />
          <Boton soloIcono etiqueta="Ajustes" icono={IconoAjustes} />
        </Encabezado>

        <Bento>
          <BentoCelda columnas={12} columnasMedio={6}>
            <div className="pm-orbes pm-rubro-juridico">
              <span className="pm-orbe pm-orbe--a" aria-hidden="true" />
              <span className="pm-orbe pm-orbe--b" aria-hidden="true" />
              <span className="pm-orbe pm-orbe--c" aria-hidden="true" />
              <SaludoJarvis
              saludo="Buen día, Ana."
              frases={["Entraron 46 consultas desde ayer.", "3 personas esperan respuesta hace más de 2 horas."]}
              acciones={[
                { texto: "Decidir 2 cosas", href: "/diseno-muestra#decidir" },
                { texto: "Ver resumen", href: "/diseno-muestra#anillos" },
              ]}
              />
            </div>
          </BentoCelda>

          <CeldaAnillo i={0} />
          <CeldaAnillo i={1} />

          <BentoCelda columnas={4} columnasMedio={6} filas={2}>
            <section id="decidir" aria-labelledby="decidir-t" style={{ display: "grid" }}>
              <Tarjeta aparecer={3} relieve rubro="juridico">
                <h2 id="decidir-t" className="pm-tarjeta__titulo" style={{ marginBottom: 8, fontSize: 20 }}>
                  Para decidir
                </h2>
                <ul className="pm-lista-filas">
                  <li>
                    <span>Responder a 3 chats que esperan hace más de 2 horas</span>
                    <Pastilla estado="error">Urgente</Pastilla>
                  </li>
                  <li>
                    <span>Aprobar la campaña de Autos 0 km</span>
                    <Pastilla estado="atencion">Revisar</Pastilla>
                  </li>
                  <li>
                    <span>Revisar el aviso de Coberturas médicas</span>
                    <Pastilla estado="info">Nuevo</Pastilla>
                  </li>
                  <li>
                    <span>Contestar 2 consultas de Marketing</span>
                    <Pastilla estado="info">Nuevo</Pastilla>
                  </li>
                  <li>
                    <span>Revisar el presupuesto de Jurídico</span>
                    <Pastilla>Sin apuro</Pastilla>
                  </li>
                </ul>
                <VerMas>
                  <ul className="pm-lista-filas">
                    <li>
                      <span>Dejar lista la base de Marketing</span>
                      <Pastilla>Sin apuro</Pastilla>
                    </li>
                    <li>
                      <span>Confirmar el turno del jueves</span>
                      <Pastilla estado="ok">Resuelto</Pastilla>
                    </li>
                  </ul>
                </VerMas>
              </Tarjeta>
            </section>
          </BentoCelda>

          <CeldaAnillo i={2} />
          <CeldaAnillo i={3} />

          <BentoCelda columnas={12} columnasMedio={6}>
            <Tarjeta aparecer={6} rubro="coberturas_medicas">
              <div className="pm-franja">
                <Medidor valor={92} rubro="coberturas_medicas" sufijo="%" nombre="Servicios en orden" unidad="" etiqueta="anda bien" />
                <div className="pm-franja__texto">
                  <h2 className="pm-tarjeta__titulo" style={{ fontSize: 20 }}>
                    Salud: casi todo anda
                  </h2>
                  <p className="pm-subtitulo" style={{ margin: "4px 0 12px" }}>
                    11 de 12 servicios responden. El que falta no frena la operación.
                  </p>
                  <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Pastilla estado="ok">11 en orden</Pastilla>
                    <Pastilla estado="atencion">1 para revisar</Pastilla>
                  </span>
                </div>
                <Boton href="/salud" variante="primario">
                  Ver detalle
                </Boton>
              </div>
            </Tarjeta>
          </BentoCelda>
        </Bento>

        <section id="anillos" aria-labelledby="tamanos">
          <h2 id="tamanos" className="pm-seccion__titulo">
            Anillos, cifras y botones
          </h2>
          <Bento>
            <BentoCelda columnas={6} columnasMedio={6}>
              <Tarjeta titulo="Anillo grande, mediano y chico" rubro="coberturas_medicas" aparecer={1}>
                <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                  <Anillo valor={72} rubro="coberturas_medicas" tamano="grande" sufijo="%" unidad="de afiliaciones cargadas" nombre="Afiliaciones" />
                  <Anillo valor={72} rubro="coberturas_medicas" tamano="medio" sufijo="%" unidad="de afiliaciones cargadas" nombre="Afiliaciones" />
                  <Anillo valor={72} rubro="coberturas_medicas" tamano="chico" sufijo="%" unidad="de afiliaciones cargadas" nombre="Afiliaciones" />
                </div>
                <p className="pm-nota" style={{ marginTop: 16 }}>
                  160 px en escritorio, 120 px en celular y 64 px en listas.
                </p>
              </Tarjeta>
            </BentoCelda>
            <BentoCelda columnas={6} columnasMedio={6}>
              <Tarjeta titulo="Campañas: respuesta por campaña" rubro="agencia_0km" aparecer={2}>
                <ul className="pm-lista-filas">
                  {[
                    { n: "Lanzamiento SUV", v: 34, e: "ok" as const, t: "Funciona" },
                    { n: "Test drive de fin de mes", v: 18, e: "atencion" as const, t: "Para revisar" },
                    { n: "Reactivar consultas viejas", v: 6, e: "error" as const, t: "Pausada" },
                  ].map((f) => (
                    <li key={f.n}>
                      <span className="pm-fila-chica">
                        <Anillo valor={f.v} rubro="agencia_0km" tamano="chico" sufijo="%" unidad="de respuesta" nombre={f.n} />
                        <span style={{ color: "var(--pm-texto)", fontSize: 15 }}>{f.n}</span>
                      </span>
                      <Pastilla estado={f.e}>{f.t}</Pastilla>
                    </li>
                  ))}
                </ul>
              </Tarjeta>
            </BentoCelda>
            <BentoCelda columnas={6} columnasMedio={6}>
              <Tarjeta titulo="Cifras sueltas" rubro="marketing" relieve aparecer={3}>
                <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                  <Cifra valor={1284} tamano="xl" etiqueta="Alcance del mes" detalle="+9 % que el mes pasado" />
                  <Cifra valor={46} tamano="l" etiqueta="Consultas" />
                  <Cifra valor={3} tamano="m" etiqueta="Esperando" />
                </div>
                <p className="pm-nota" style={{ marginTop: 16 }}>
                  La cifra cuenta una sola vez al aparecer. Con movimiento reducido sale en su valor final.
                </p>
              </Tarjeta>
            </BentoCelda>
            <BentoCelda columnas={6} columnasMedio={6}>
              <Tarjeta titulo="Botones neumórficos" aparecer={4}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                  <Boton variante="primario">Dejar lista</Boton>
                  <Boton>Ver resumen</Boton>
                  <Boton presionado>Filtro activo</Boton>
                  <Boton deshabilitado>Sin acción</Boton>
                  <Boton soloIcono etiqueta="Actualizar" icono={IconoActualizar} />
                  <Boton soloIcono etiqueta="Ajustes" icono={IconoAjustes} presionado />
                </div>
                <p className="pm-nota" style={{ marginTop: 16 }}>
                  Salen de la superficie (luz arriba a la izquierda, sombra abajo a la derecha) y se hunden al presionar. Solo en botones de acción e íconos.
                </p>
              </Tarjeta>
            </BentoCelda>
          </Bento>
        </section>

        <section aria-labelledby="paleta">
          <h2 id="paleta" className="pm-seccion__titulo">
            Paleta
          </h2>
          <p className="pm-seccion__nota">Cada rubro usa solo su acento dentro de su pantalla.</p>
          <div className="pm-paleta">
            {RUBROS_PREMIUM.map((r) => (
              <div key={r} className={`pm-muestra-color ${claseRubro(r)}`}>
                <i style={{ background: ACENTO_RUBRO[r] }} />
                <span>{NOMBRE_RUBRO[r]}</span>
                <code>{ACENTO_RUBRO[r]}</code>
              </div>
            ))}
            <div className="pm-muestra-color">
              <i style={{ background: FONDO_PREMIUM }} />
              <span>Fondo</span>
              <code>{FONDO_PREMIUM}</code>
            </div>
            {Object.entries(TEXTO_PREMIUM).map(([k, v]) => (
              <div key={k} className="pm-muestra-color">
                <i style={{ background: v }} />
                <span>Texto {k}</span>
                <code>{v}</code>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
