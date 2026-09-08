import sys, zlib, struct, olefile

EXT = {1,2,3,11,12,14,15,16,17,18,21,22,23}
INL = {4,5,6,7,8,9,19,20}

def para_text(payload):
    out = []
    n = len(payload)//2
    i = 0
    while i < n:
        c = struct.unpack_from('<H', payload, i*2)[0]
        if c >= 32:
            out.append(chr(c)); i += 1
        elif c in (10, 13):
            out.append('\n'); i += 1
        elif c == 9:
            out.append('\t'); i += 8
        elif c in EXT or c in INL:
            out.append('\n'); i += 8
        else:
            i += 1
    return ''.join(out)

def records(data):
    i = 0
    while i + 4 <= len(data):
        h = struct.unpack_from('<I', data, i)[0]; i += 4
        tag = h & 0x3ff; size = (h >> 20) & 0xfff
        if size == 0xfff:
            size = struct.unpack_from('<I', data, i)[0]; i += 4
        yield tag, data[i:i+size]
        i += size

def extract(path):
    f = olefile.OleFileIO(path)
    hdr = f.openstream('FileHeader').read()
    comp = bool(hdr[36] & 1)
    secs = sorted(['/'.join(s) for s in f.listdir() if s[0] == 'BodyText'])
    buf = []
    for s in secs:
        raw = f.openstream(s).read()
        if comp:
            raw = zlib.decompress(raw, -15)
        for tag, pl in records(raw):
            if tag == 67:
                t = para_text(pl).strip()
                if t: buf.append(t)
    f.close()
    return '\n'.join(buf)

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    print(extract(sys.argv[1]))
