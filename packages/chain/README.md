# @webglify/chain - A WebGL2 Library for KISS and DRY

This library is designed to render WebGL while adhering to the principles of DRY (Don't Repeat Yourself) and KISS (Keep It Simple, Stupid). The goal is to provide a straightforward interface with a minimal amount of library-specific abstractions. If you're familiar with the WebGL, then this library is primarily about the conventions of how to organize things. That's it.


## Installation

```
npm install @webglify/chain
```

## Basic Usage

```
import chain from '@webglify/chain';

const gl = document.querySelector('canvas#fancyCanvas').getContext('webgl2');

// Put shaders together
const { renderFrame } = chain(gl, [
  // pass1
  {
    vertexShader: vertexShader1,
    fragmentShader: fragmentShader1
  },
  // pass2
  {
    vertexShader: vertexShader2,
    fragmentShader: fragmentShader2
  }
  // ... add more passes as needed
]);

// Render the frame!
renderFrame();

```


## Working with Uniforms
Uniforms are a way to send data from your JavaScript code to your WebGL shaders. Here's how you can use uniforms with this library:

If you've defined a uniform in your shader, like:

```glsl
uniform float uTime;

void main(){
  
  vec2 pos = vec2(sin(uTime), cos(uTime));
  // ...

}

```

You can communicate with it from your JavaScript code as follows:

```
const STATE = {
  time: 0
}

chain(gl, [
  {
    vertexShader: vertexShader1,
    fragmentShader: fragmentShader2,
    uniforms(gl, uniformLocations){
      gl.uniform1f(uniformLocations.uTime, STATE.time)      
    }
  },
])


```

---

comming soon:

**Advanced Usage**: Dive deeper into more complex features or configurations.

**API Reference**: A detailed breakdown of the library's API.

**Contributing**: Information for developers who want to contribute to the library.

**License**: Information about the library's licensing.