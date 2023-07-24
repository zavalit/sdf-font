type FontMetaType = {
    unitsPerEm: number;
    ascender: number;
    descender: number;
    capHeight: number;
    xHeight: number;
    lineGap: number;
};
interface SDFParams {
    sdfItemSize: number;
    sdfExponent: number;
}
type TexturesDict = {
    [key in TextureFormat]: (HTMLCanvasElement | OffscreenCanvas);
} | {};
type TexturesType = {
    textures: TexturesDict;
    sdfParams: SDFParams;
};
type GlyphTexturesType = {
    sizesMap: {
        [key: string]: number[];
    };
    fontMeta: FontMetaType;
} & TexturesType;
export enum TextureFormat {
    EDGE = "EDGE",
    DISTANCE = "DISTANCE"
}
export const createGlyphTexture: (texturesDict: TexturesDict, fontUrl: string, sdfParams: SDFParams, charCodes: number[]) => Promise<GlyphTexturesType>;
export function cmdsToPath(cmds: any, crds: any): string;
export function getSegements(path: any): Float32Array;
export class FontSvgApi {
    fontBuffer: ArrayBuffer;
    constructor(fontBuffer: ArrayBuffer);
    parse(): any;
    static asyncInit(src: string): Promise<FontSvgApi>;
}
export type FontDataType = {
    cmap: any;
    head: any;
    hhea: any;
    maxp: any;
    hmtx: any;
    name: any;
    'OS/2': any;
    post: any;
    loca: any;
    kern: any;
    glyf: any;
    CFF: any;
    CBLC: any;
    CBDT: any;
    SVG: any;
    COLR: any;
    CPAL: any;
    sbix: any;
};
export const codeToGlyph: (fontData: FontDataType, charCode: number) => any;
export const glyphToPath: (fontData: FontDataType, glyphId: number) => any;

//# sourceMappingURL=types.d.ts.map
