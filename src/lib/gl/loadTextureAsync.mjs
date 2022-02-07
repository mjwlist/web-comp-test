import { Texture } from 'ogl';

// not sure why this doesn't work locally
/**
 * async loads image 
 * @param src {string}
 * @returns {Promise<HTMLImageElement>}
 */
async function getImage(src) {
    const response = await fetch(src, { mode: 'cors' });
    const blob = await response.blob();

    if (!!createImageBitmap) {
        return await createImageBitmap(blob, { imageOrientation: 'flipY', premultiplyAlpha: 'none' });
    }

    return new Promise((resolve, reject) => {
        const urlLoader = (!!URL ? URL : webkitURL);
        const objectUrl = urlLoader.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            resolve(img);
            urlLoader.revokeObjectURL(objectUrl);
        }
        img.onerror = reject;
        img.src = objectUrl;
    });
}

function powerOfTwo(value) {
    return Math.log2(value) % 1 === 0;
}

/**
 * loads image from source async
 * determines if image is mipmapable
 * returns a function that accepts a webglrendering context and returns a texture with provided options
 * @param src {string}
 * @returns {Promise<(gl: WebGLRenderingContext) => Texture>}
 */
export default async function loadTextureAsync(src) {
    const image = await getImage(src);
    const mipmapable = powerOfTwo(image.width) && powerOfTwo(image.height);

    return (gl, options = {}) => {
        const mipmapableOptions = mipmapable ? options : {
            ...options,
            generateMipmaps: false,
            minFilter: gl.LINEAR,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
        };
        const texture = new Texture(gl, {
            ...mipmapableOptions, image
        });

        if (!!image.close) {
            texture.onUpdate = () => {
                texture.onUpdate = null;
                image.close();
            };
        }

        return texture;
    };
}