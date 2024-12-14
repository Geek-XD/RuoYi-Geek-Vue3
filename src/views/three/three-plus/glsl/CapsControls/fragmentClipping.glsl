uniform vec3 color;
uniform vec3 clippingLow;
uniform vec3 clippingHigh;
uniform sampler2D map;

varying vec3 pixelNormal;
varying vec4 worldPosition;


void main(void) {

    float shade = (3.0 * pow(abs(pixelNormal.y), 2.0) + 2.0 * pow(abs(pixelNormal.z), 2.0) + 1.0 * pow(abs(pixelNormal.x), 2.0)) / 3.0;

    if(worldPosition.x < clippingLow.x || worldPosition.x > clippingHigh.x || worldPosition.y < clippingLow.y || worldPosition.y > clippingHigh.y || worldPosition.z < clippingLow.z || worldPosition.z > clippingHigh.z) {

        discard;

    } else {
        gl_FragColor = vec4(color * shade, 1.0);
    }

}