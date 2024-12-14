uniform vec3 clippingLow;
uniform vec3 clippingHigh;

varying vec3 pixelNormal;
varying vec4 worldPosition;
varying vec3 camPosition;


void main() {

    pixelNormal = normal;
    worldPosition = modelMatrix * vec4(position, 1.0);
    camPosition = cameraPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}