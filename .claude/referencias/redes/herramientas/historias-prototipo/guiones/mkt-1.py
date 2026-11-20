# Kocos Marketing · tramo mkt-1 (reels del 20/11 16:30 al 24/11) · cronograma x2.
# Esqueleto fijo (el de mkt): 0 gancho del personaje (pings) · 1 dato · 2 «frio» · 3 · 4 «giro» · 5 anuncio · items 1-3 · «alivio» · cierre.
# Así sonido.py ubica el golpe del objeto gigante (frase 4) y la caída (frase 5) sin tocar el motor.
R = {}
VOCES = {}


def _reel(palabra, serie, gancho, dato, frio, quiebre, giro, anuncio, items, alivio, cfg, sub='y te respondemos'):
    """items: tres pares (say, show). Los textos con *…* van destacados en el subtítulo."""
    fr = [
        dict(q='laura', say=gancho[0], show=gancho[1], p=.3, marca='pings'),
        dict(q='nar', say=dato[0], show=dato[1], p=.25),
        dict(q='nar', say=frio[0], show=frio[1], p=.4, marca='frio'),
        dict(q='nar', say=quiebre[0], show=quiebre[1], p=.2),
        dict(q='nar', say=giro[0], show=giro[1], p=.4, marca='giro'),
        dict(q='nar', say=anuncio[0], show=anuncio[1], p=.25),
    ]
    for i, (s, sh) in enumerate(items, 1):
        fr.append(dict(q='nar', say=('Uno: ', 'Dos: ', 'Tres: ')[i - 1] + s, show=sh, p=.3 if i < 3 else .4, item=i))
    fr.append(dict(q='laura', say=alivio[0], show=alivio[1], p=.3, marca='alivio'))
    fr.append(dict(q='nar', say=f'Comentá «{palabra.lower()}», {sub}.', show=f'Comentá *{palabra}*', p=.2, cta=1, r=-3))
    cfg = dict(cfg); cfg.setdefault('ctaSub', sub)
    return dict(palabra=palabra, serie=serie, nar='nar_f', cfg=cfg, frases=fr)


# 20/11 16:30 · catalogo B · API · cocina de Dulce Almagro de noche · dato primero · primer plano del contador · pin gigante sobre Almagro
R['mkt-catalogo-b'] = _reel('API', 'Antes / después',
    ('¡Basta de mandar fotos sueltas!', '¡Basta de mandar fotos sueltas!'),
    ('Treinta fotos por chat, y todos preguntan lo mismo.', '*30 fotos* por chat y todos preguntan *lo mismo.*'),
    ('Mientras buscás la foto, la consulta se enfría.', 'Mientras buscás la foto, la consulta *se enfría.*'),
    ('Las fotos sueltas no venden solas.', 'Las fotos sueltas *no venden solas.*'),
    ('Un catálogo, sí.', 'Un catálogo, *sí.*'),
    ('Armalo en tres pasos.', 'Armalo en *tres pasos:*'),
    [('cargá cada producto con foto y precio.', 'Cada producto con *foto y precio.*'),
     ('sumá una descripción corta.', 'Sumá una *descripción corta.*'),
     ('mandá el link del catálogo en cada respuesta.', 'El link del catálogo *en cada respuesta.*')],
    ('¡Ahora eligen solos!', '¡Ahora eligen solos!'),
    dict(hook='Basta de <em>fotos sueltas:</em><br>tu catálogo en WhatsApp', pantalla='catalogo', lugar='cocina', contador='Sin responder', n0=12, n1=30,
         cards=['Foto y precio', 'Descripción corta', 'Link en cada chat'], ap='celu', cam='empuje', grade='noche',
         irreal=dict(objeto='pin', doc='Almagro', cielo=['#3a2a6a', '#1a1238', '#08060f'], fondo=['#2a1a4a', '#08060f'])))

# 20/11 19:20 · web-movil B · WEB · vereda de Medrano · abre en el contador y se aleja · cámara en mano · libreta gigante
R['mkt-web-movil-b'] = _reel('WEB', 'Antes / después',
    ('¿Dónde está el botón para pedir?', '¿Dónde está el botón para pedir?'),
    ('Tu cliente abre tu web en el celular, y no encuentra cómo pedir.', 'Abre tu web en el celular y *no encuentra cómo pedir.*'),
    ('Achica, agranda, busca… y se va.', 'Achica, agranda, busca… *y se va.*'),
    ('Casi todos te miran desde el celular.', 'Casi todos te miran *desde el celular.*'),
    ('Tu web tiene que estar pensada para eso.', 'Tu web, *pensada para el celular.*'),
    ('Revisala en tres pasos.', 'Revisala en *tres pasos:*'),
    [('el botón de pedir, arriba y a la vista.', 'Botón de pedir *arriba y a la vista.*'),
     ('letra grande, sin achicar la pantalla.', 'Letra grande, *sin achicar.*'),
     ('un toque y llega a tu WhatsApp.', 'Un toque y *llega a tu WhatsApp.*')],
    ('¡Ahora sí piden!', '¡Ahora sí piden!'),
    dict(hook='Abrí tu web en el celular: <em>¿encontrás cómo pedir?</em>', pantalla='web', lugar='vereda', hora='tarde', contador='Sin responder', n0=3, n1=12,
         cards=['Botón arriba', 'Letra grande', 'Directo a WhatsApp'], ap='celu', cam='mano', grade='calido',
         irreal=dict(objeto='libreta', doc='Medrano', cielo=['#7a4a2a', '#3a2216', '#140c08'], fondo=['#1c2450', '#06081a'], raya='#ffe9a8')))

# 20/11 20:50 · precio A · RESPUESTAS · mostrador de Dulce Almagro · celular gigante frente a Romina diminuta
R['mkt-precio-a'] = _reel('RESPUESTAS', 'El celular que no para',
    ('¿Precio? ¿Y le pongo «por privado»?', '¿Precio? ¿Le pongo «por privado»?'),
    ('Te escriben «¿precio?», seco, sin saludo.', 'Te escriben *«¿precio?»*, seco.'),
    ('Contestás «por privado»… y la consulta se enfría.', '«Por privado»… y la consulta *se enfría.*'),
    ('El que pregunta el precio ya está interesado.', 'El que pregunta el precio *ya está interesado.*'),
    ('Respondé con información.', 'Respondé *con información.*'),
    ('Tu respuesta, en tres partes.', 'Tu respuesta, en *tres partes:*'),
    [('el precio y qué incluye.', 'El precio *y qué incluye.*'),
     ('una pregunta para entender qué busca.', 'Una pregunta para *entender qué busca.*'),
     ('un siguiente paso concreto.', 'Un *siguiente paso* concreto.')],
    ('¡Listo, me reservaron dos!', '¡Listo, me reservaron dos!'),
    dict(hook='Te preguntan <em>«¿precio?»</em><br>¿Qué respondés?', pantalla='chats', lugar='mostrador', contador='Consultas frías', n0=18, n1=34,
         msgs=['¿Precio?', 'precio', '¿Cuánto sale?', '¿Precio la chocotorta?', '¿$?', 'Hola, ¿precio?', '¿Valor?', '¿Precio x docena?'],
         etapas=[['Precio enviado', '#FC6E20'], ['Preguntó', '#4E9BE4'], ['Reservó', '#2ecc71']],
         cards=['Precio y qué incluye', 'Una pregunta', 'Siguiente paso'], grade='oro',
         irreal=dict(objeto='celu', doc='¿Precio?', cielo=['#5a3a1c', '#2a1a12', '#120c08'])))
