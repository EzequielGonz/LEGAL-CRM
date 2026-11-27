# Utilidad de edición: reemplaza o intercambia bloques R(...) en los archivos de datos.
import re
def bloque(s, marca):
    i = s.index(marca)
    j = i + 1
    while True:
        k = s.find('\nR(', j); h = s.find('\n#', j); e = s.find('\n]', j)
        cands = [x for x in (k, h, e) if x != -1]
        return i, min(cands) + 1
def reemplazar(f, marca, nuevo):
    s = open(f).read(); i, j = bloque(s, marca); s = s[:i] + nuevo.strip('\n') + '\n' + s[j:]; open(f, 'w').write(s)
def intercambiar(f, m1, m2):
    s = open(f).read(); a = bloque(s, m1); b = bloque(s, m2)
    if a[0] > b[0]: a, b = b, a
    A = s[a[0]:a[1]]; B = s[b[0]:b[1]]
    s = s[:a[0]] + B + s[a[1]:b[0]] + A + s[b[1]:]; open(f, 'w').write(s)
def sub(f, a, b, n=1):
    s = open(f).read(); assert s.count(a) >= 1, (f, a); s = s.replace(a, b) if n == 0 else s.replace(a, b, n); open(f, 'w').write(s)
def cortar_variantes(f):
    s = open(f).read(); i = s.index('\nVARIANTES = ['); open(f, 'w').write(s[:i] + '\n')
