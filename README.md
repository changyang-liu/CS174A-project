# CS174A Mouse Picking Group Project

### Team member names and UIDs
1. Duc Anh Nguyen	705179843
2. Chang Yang Liu	905369451
3. William Chen	905006238

### Overview
This project consists of a scene in a bedroom, where individual objects can be interacted with using mouse picking. Each object is a class that includes the objects to be drawn as well as different methods that implement the mouse picking and interaction. When an object detects that it has been clicked on, an animation will be performed by counting the number of frames that have passed and performing transformations on the object, as well as changing the properties of lights associated with the object. Clicking on the object again reverses this process and reverts the object back to its original state.

### Design and Implementation
0. The program first initializes all of the object models in the scene and assigns unique IDs to each object.
1. Then, the dummy scene is drawn using unique IDs as the color in the material for each object
2. The color of the pixel under the mouse when it is clicked is read using gl.readPixels()
3. The color is processed into a usable ID and the object that was clicked on is identified
4. Based on which object was clicked on, an interaction is performed which modifies the object’s internal state, like its position and appearance
5. Based on which object was clicked on, the program state is updated to account for turning on/off lights
6. The dummy scene is cleared, and the real scene is drawn with proper textures / materials for viewing.

### Advanced features
#### Mouse-picking
To perform mouse picking, we used a method that involves drawing a dummy scene where each object was assigned a unique color to identify itself. Then, to detect which object was clicked on, the color of the pixel under the mouse is read and the color is used to select the correct object in the scene. Afterwards, the buffer is cleared and the real scene is drawn with proper textures / materials.

### References
The mouse picking algorithm was adapted from WebGLFundamentals (referenced on Piazza):
https://webglfundamentals.org/webgl/lessons/webgl-picking.html
