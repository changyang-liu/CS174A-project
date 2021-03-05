import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;


export class GroupProject extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        
        this.mouseX = -1;
        this.mouseY = -1;
        this.initialized = false;
        
        // leave empty here, populate this with custom models in the initialize if-statement in display() so we can access program_state and have dynamic models
        this.models = {};
        
        
        // don't recommend using these, suggest making your own class for each model, with the class specification shown below in Lamp_Model
        this.shapes = {};
        this.materials = {};
        
        // look_at(cameraPosition, target, up)
        this.initial_camera_location = Mat4.look_at(vec3(30, 60, -20), vec3(0, 0, 0), vec3(0, 0, -1));
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Do-nothing", ["Control", "0"], () => 0);
        this.new_line();
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }
        let model_transform = Mat4.identity();
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);
		program_state.lights = [];
		program_state.lights.push(new Light(vec4(-30,50,-20,1), color(0.2, 0.4, 1, 1), 1000*3));
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        

        // do some set up
        const gl = context.context;
        if (!this.initialized) {
        	this.initialized = true;
        	// create mouse click listener
        	gl.canvas.addEventListener('click', (e) => {
        	    const rect = context.canvas.getBoundingClientRect();
        	    this.mouseX = e.clientX - rect.left;
        	    this.mouseY = e.clientY - rect.top;
            });

            // create all models in our scene
            // here, we are creating two lamps, one on the floor and one on top of a nightstand, each of which will light up when clicked
            let mt_drawer1 = model_transform.times(Mat4.translation(0,-5,3));
            this.models.drawer1 = new Drawer_Model(program_state, mt_drawer1, 2);

            let mt_lamp1 = model_transform.times(Mat4.translation(-8,30,4));
            let mt_lamp2 = model_transform.times(Mat4.translation(-2,-6,-4.55));
            this.models.lamp1 = new Lamp_Model(program_state, mt_lamp1);
            this.models.lamp2 = new Lamp_Model(program_state, mt_lamp2);

            
        }

        // draw dummy models for mouse picking
        let model_id = 1000;
        for (var model_name in this.models) {
        	// assign ID to model
            this.models[model_name].id = model_id; // id is used to identify the model from the call to gl.readPixels()
            
            var r = Math.floor(model_id / (255*255));
            var g = Math.floor(model_id / 255) % 256;
            var b = model_id % 256;
            var c = color(r/255,g/255,b/255,1);
            this.models[model_name].id_color = c; // id_color is used to override the model's material color when drawing

        	// draw "dummy" model to mouse-pick
        	this.models[model_name].draw_dummy(context,program_state);

        	model_id++;
        }
        
        
        // get model under mouse
        const pixelX = this.mouseX * gl.canvas.width / gl.canvas.clientWidth;
        const pixelY = gl.canvas.height - this.mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
        const data = new Uint8Array(4);
        gl.readPixels(pixelX,pixelY,1,1,gl.RGBA,gl.UNSIGNED_BYTE,data);
        // reset clicked position
        this.mouseX = -1;
        this.mouseY = -1;

        // convert RGB to decimal (model id)
        const selected_model_id = data[0]*256*256 + data[1]*256 + data[2];
        // remove dummy models
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // find model that was clicked and cause interaction
        for (var model_name in this.models) {
        	if (this.models[model_name].id == selected_model_id) {
        		this.models[model_name].interact();
        		break;
        	}
        }
        
        // update program state before drawing
        // (the program state should be constant while drawing, so we will do all the updates at once here before drawing)
        for (var model_name in this.models) {
            program_state = this.models[model_name].update_state(program_state);
        }
        
        // draw objects to canvas (the real, final models)
        for (var model_name in this.models) {
        	var cur_model = this.models[model_name];
        	cur_model.draw(context, program_state);
        }
    }
}

/*
 All models must define:
  - update_state(program_state, model_transform) // if you don't need to modify program_state, just return program_state as is
  - draw(context, program_state) // draws the model normally
  - draw_dummy(context, program_state) // draws a dummy version of the model which uses the mouse_picking dummy material, color set to model ID
  - interact(program_state) // change some internal state of the model
  - update_transform(program_state, model_transform) // can be inlined, but by having it separate we can allow for dynamic/moving models
*/
class Lamp_Model {
	constructor(program_state, model_transform = Mat4.identity(), scale=1) {
		this.scale = scale;
		this.rod_length = 5;
		this.isOn = false;

        this.shapes = {
        	lamp_shade: new (defs.Cylindrical_Tube.prototype.make_flat_shaded_version())( 7, 10,  [[ .67, 1  ], [ 0,1 ]] ),
			lamp_pole: new defs.Cylindrical_Tube( 7, 10,  [[ .67, 1  ], [ 0,1 ]] ),
			lamp_base: new defs.Cube(),
			lamp_bulb: new defs.Subdivision_Sphere(3),
        }
        this.materials = {
            mouse_picking: new Material(new Picking_Shader(),
                {ambient: 0.2, specularity: 1.0, diffusivity: 0.8, color: hex_color("#FFFFFF")}),

        	lamp_shade: new Material(new Gouraud_Shader(),
                {ambient: 0.2, specularity: 1.0, diffusivity: 0.8, color: hex_color("#d9be7e")}),
            lamp_pole: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0.1, diffusivity: 0.8, color: hex_color("#383c57")}),
            lamp_base: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 1.0, diffusivity: 0.8, color: hex_color("#383c57")}),
            lamp_bulb: new Material(new Gouraud_Shader(),
                {ambient: 0.5, specularity: 1.0, diffusivity: 1.0, color: hex_color("#FFFFFF")}),
        }

        this.update_transform(program_state, model_transform);
	}
	// if the position of the object needs to be dynamic, recompute the transformations of its components
    update_transform(program_state, model_transform) {
    	// Given model_transform for initial position of the lamp, set the relative position of the pole/base/lightbulb
    	model_transform = model_transform.times(Mat4.scale(this.scale,this.scale,this.scale));
		this.model_transform = model_transform
		this.mt_shade = model_transform.times(Mat4.scale(2,2,3));
		this.mt_pole = model_transform.times(Mat4.translation(0,0,this.rod_length/2)).times(Mat4.scale(0.2, 0.2, this.rod_length));
		this.mt_base = model_transform.times(Mat4.translation(0,0,this.rod_length)).times(Mat4.scale(1.5,1.5,0.2));
		this.mt_bulb = model_transform.times(Mat4.scale(0.75,0.75,0.75));
    }
    update_state(program_state) {
    	program_state.lights.push(new Light(this.model_transform.times(vec4(0,0,0,1)), color(1, 0.8, 0.8, 1), 3*1000*this.isOn));
    	return program_state;
    }
	draw(context, program_state, model_transform = null) {
		// if the position of the object needs to be dynamic, recompute the transformations of its components
		if (model_transform != null) {
		    this.update_transform(program_state, model_transform);
		}
		
		let lamp_ambient = 0.2;

		if (this.isOn) {
			lamp_ambient = 0.8;
			//program_state.lights.push(new Light(this.model_transform.times(vec4(0,0,0,1)), color(1, 0.8, 0.8, 1), 1000*this.isOn));
		}
        // light source translated to center of lamp (at bulb)
		this.shapes.lamp_shade.draw(context, program_state, this.mt_shade, this.materials.lamp_shade.override({ambient: lamp_ambient}));
		this.shapes.lamp_pole.draw(context, program_state, this.mt_pole, this.materials.lamp_pole);
		this.shapes.lamp_base.draw(context, program_state, this.mt_base, this.materials.lamp_base);
		this.shapes.lamp_bulb.draw(context, program_state, this.mt_bulb, this.materials.lamp_bulb.override({ambient: lamp_ambient}));
	}
	draw_dummy(context, program_state) {
		let dummy_material = this.materials.mouse_picking.override({color: this.id_color});
		this.shapes.lamp_shade.draw(context, program_state, this.mt_shade, dummy_material);
		this.shapes.lamp_pole.draw(context, program_state, this.mt_pole, dummy_material);
		this.shapes.lamp_base.draw(context, program_state, this.mt_base, dummy_material);
		this.shapes.lamp_bulb.draw(context, program_state, this.mt_bulb, dummy_material);
	}
	interact(program_state) {
		this.isOn ^= 1;
	}
}


class Drawer_Model {
	constructor(program_state, model_transform = Mat4.identity(), scale=1) {
		this.scale = scale;
		this.leg_width = 0.3;
		this.leg_length = 5;
		this.box_width = 1.5;
		this.box_depth = 1.5;
		this.box_height = 2.5;
		this.isOn = false;

        this.shapes = {
        	//drawer_leg: new (defs.Cylindrical_Tube.prototype.make_flat_shaded_version())( 7, 10,  [[ .67, 1  ], [ 0,1 ]] ),
			drawer_box: new defs.Cube(),
			drawer_leg: new defs.Cube(),
        }
        this.materials = {
            mouse_picking: new Material(new Picking_Shader(),
                {ambient: 0.2, specularity: 1.0, diffusivity: 0.8, color: hex_color("#FFFFFF")}),

        	drawer_leg: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0, diffusivity: 0.5, color: hex_color("#75562f")}),
            drawer_box: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0.1, diffusivity: 0.5, color: hex_color("#996f3a")}),
            drawer_drawer:  new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0.1, diffusivity: 0.5, color: hex_color("#734f22")}),
            drawer_handle:  new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 1.0, diffusivity: 1.0, color: hex_color("#1a1611")}),
        }

        this.update_transform(program_state, model_transform);
	}
	update_transform(program_state, model_transform) {
		model_transform = model_transform.times(Mat4.scale(this.scale,this.scale,this.scale));
		this.model_transform = model_transform;
        model_transform = model_transform.times(Mat4.translation(0,0,this.leg_length/2));
		this.mt_leg1 = model_transform.times(Mat4.translation(-this.box_width,-this.box_depth,0)).times(Mat4.scale(this.leg_width,this.leg_width,this.leg_length/2));
		this.mt_leg2 = model_transform.times(Mat4.translation(-this.box_width,this.box_depth,0)).times(Mat4.scale(this.leg_width,this.leg_width,this.leg_length/2));
		this.mt_leg3 = model_transform.times(Mat4.translation(this.box_width,-this.box_depth,0)).times(Mat4.scale(this.leg_width,this.leg_width,this.leg_length/2));
		this.mt_leg4 = model_transform.times(Mat4.translation(this.box_width,this.box_depth,0)).times(Mat4.scale(this.leg_width,this.leg_width,this.leg_length/2));
		model_transform = model_transform.times(Mat4.translation(0,0,-this.leg_length/2));
		this.mt_body = model_transform.times(Mat4.translation(0,0,this.box_height/2)).times(Mat4.scale(this.box_width+2*(this.leg_width),this.box_depth+2*(this.leg_width),this.box_height));
		this.mt_drawer1 = model_transform.times(Mat4.translation(0,this.box_depth+2*this.leg_width,0)).times(Mat4.scale(this.box_width,this.box_depth/10,this.box_height/4));
		this.mt_drawer2 = model_transform.times(Mat4.translation(0,this.box_depth+2*this.leg_width,this.box_height/2*1.5)).times(Mat4.scale(this.box_width,this.box_depth/10,this.box_height/4));

		this.mt_handle1 = model_transform.times(Mat4.translation(0,this.box_depth+2.5*this.leg_width,0)).times(Mat4.scale(this.box_width/4,this.box_depth/10,this.box_height/12));
		this.mt_handle2 = model_transform.times(Mat4.translation(0,this.box_depth+2.5*this.leg_width,this.box_height/2*1.5)).times(Mat4.scale(this.box_width/4,this.box_depth/10,this.box_height/16));
		
    }
    update_state(program_state) {
    	return program_state;
    }
	draw(context, program_state, model_transform = null) {
		// if the position of the object needs to be dynamic, recompute the transformations of its components
		if (model_transform != null) {
		    this.update_transform(program_state, model_transform);
		}
		if (this.isOn) {

		}
		this.shapes.drawer_leg.draw(context, program_state, this.mt_leg1, this.materials.drawer_leg);
		this.shapes.drawer_leg.draw(context, program_state, this.mt_leg2, this.materials.drawer_leg);
		this.shapes.drawer_leg.draw(context, program_state, this.mt_leg3, this.materials.drawer_leg);
		this.shapes.drawer_leg.draw(context, program_state, this.mt_leg4, this.materials.drawer_leg);
        
		this.shapes.drawer_box.draw(context, program_state, this.mt_body, this.materials.drawer_box);
		this.shapes.drawer_box.draw(context, program_state, this.mt_drawer1, this.materials.drawer_drawer);
		this.shapes.drawer_box.draw(context, program_state, this.mt_drawer2, this.materials.drawer_drawer);
		this.shapes.drawer_box.draw(context, program_state, this.mt_handle1, this.materials.drawer_handle);
		this.shapes.drawer_box.draw(context, program_state, this.mt_handle2, this.materials.drawer_handle);
        
	}
	draw_dummy(context, program_state) {
		let dummy_material = this.materials.mouse_picking.override({color: this.id_color});
		
		this.shapes.drawer_leg.draw(context, program_state, this.mt_leg1, dummy_material);
		this.shapes.drawer_leg.draw(context, program_state, this.mt_leg2, dummy_material);
		this.shapes.drawer_leg.draw(context, program_state, this.mt_leg3, dummy_material);
		this.shapes.drawer_leg.draw(context, program_state, this.mt_leg4, dummy_material);
        
		this.shapes.drawer_box.draw(context, program_state, this.mt_body, dummy_material);
		this.shapes.drawer_box.draw(context, program_state, this.mt_drawer1, dummy_material);
		this.shapes.drawer_box.draw(context, program_state, this.mt_drawer2, dummy_material);
		this.shapes.drawer_box.draw(context, program_state, this.mt_handle1, dummy_material);
		this.shapes.drawer_box.draw(context, program_state, this.mt_handle2, dummy_material);
		
	}
	interact(program_state) {
		this.isOn ^= 1;
	}
	
}


// special shader to keep track of model IDs
class Picking_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed())); // Yunqi's discussion
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
        
        // send the material's color as input to be set as the unique ID of the object
        context.uniform4fv(gpu_addresses.u_id, material.color);
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
            gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
            point_position = model_transform*vec4(position, 1.0);
            center = model_transform*vec4(0.0, 0.0, 0.0, 1.0);
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        // ring material color is #c76504, which in RGB is (199,101,4), which in relative / percent RGB is (0.78, 0.396, 0.016)
        return this.shared_glsl_code() + `
        precision mediump float;
        uniform vec4 u_id;
        void main(){
        	gl_FragColor = u_id;
        }`;
    }
}





class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 3) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        varying vec4 COLOR; // Wuyue's discussion hint
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;

                // Wuyue's discussion hint
                COLOR = vec4(shape_color.xyz * ambient, shape_color.w);
                COLOR.xyz += phong_model_lights( normalize(N), vertex_worldspace);
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                gl_FragColor = COLOR;
                gl_FragColor.xyz = COLOR.xyz;
                // Compute an initial (ambient) color:
                //gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                //gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

