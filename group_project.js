import {defs, tiny} from './examples/common.js';
import {Flooring} from './Flooring.js';
import {Wall} from './Wall.js';
import {Drawer_Model} from './Drawer_Model.js';
import {Lamp_Model} from './Lamp_Model.js';
import {Table_Model} from './Table_Model.js';
import {Chair_Model} from './Chair_Model.js';
import {Monitor_Model} from './Monitor_Model.js';
import {Door_Model} from './Door_Model.js';
import {Bed_Model} from './bed.js'
import {Window_Model} from "./window.js"
import { Phone_Model } from './phone.js';


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
		program_state.lights.push(new Light(vec4(0,50,-20,1), color(0.2, 0.4, 1, 1), 1000*5));
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        

        // do some set up
        const gl = context.context;

        if (!this.initialized) 
        {
        	this.initialized = true;
        	// create mouse click listener
        	gl.canvas.addEventListener('click', (e) => {
        	    const rect = context.canvas.getBoundingClientRect();
        	    this.mouseX = e.clientX - rect.left;
        	    this.mouseY = e.clientY - rect.top;
            });

            // create all models in our scene
            // here, we are creating two lamps, one on the floor and one on top of a nightstand, each of which will light up when clicked
            const ground_level = 13; // arbitrary; chose to define the ground level as the bottom of drawer1, just because it was the order that it was coded in

            let mt_drawer1 = model_transform.times(Mat4.translation(-20,-40,3));
            this.models.drawer1 = new Drawer_Model(program_state, mt_drawer1, 2);

            let mt_table = model_transform.times(Mat4.translation(-45,10,3));
            this.models.table = new Table_Model(program_state, mt_table, 2);

            let mt_chair = model_transform.times(Mat4.translation(-40,10,ground_level-5.0));
            this.models.chair = new Chair_Model(program_state, mt_chair, 2);

            let mt_monitor = model_transform.times(Mat4.translation(-49,10,ground_level-20));
            this.models.monitor = new Monitor_Model(program_state, mt_monitor, 2);

            let mt_door = model_transform.times(Mat4.translation(49,10,ground_level-18));
            this.models.door = new Door_Model(program_state, mt_door, 2);

            let mt_lamp1 = model_transform.times(Mat4.translation(-45,25,ground_level-20));
            let mt_lamp2 = model_transform.times(Mat4.translation(-2-20,-40-1,-4.55));
            this.models.lamp1 = new Lamp_Model(program_state, mt_lamp1, 1, 20);
            this.models.lamp2 = new Lamp_Model(program_state, mt_lamp2, 1, 5);

            let mt_flooring = model_transform.times(Mat4.translation(0,0,ground_level));
            this.models.flooring = new Flooring(program_state, mt_flooring);

            let mt_wall_left = model_transform.times(Mat4.translation(-50,0,ground_level));
            let mt_wall_right = model_transform.times(Mat4.translation(50,0,ground_level));
            let mt_wall_front = model_transform.times(Mat4.rotation(Math.PI/2,0,0,1)).times(Mat4.translation(-50,0,ground_level)).times(Mat4.rotation(Math.PI,0,0,1));
            let mt_wall_back = model_transform.times(Mat4.rotation(Math.PI/2,0,0,1)).times(Mat4.translation(50,0,ground_level));
            
            this.models.wall_left = new Wall(program_state, mt_wall_left);
            this.models.wall_right = new Wall(program_state, mt_wall_right);
            this.models.wall_front = new Wall(program_state, mt_wall_front);
            //this.models.wall_back = new Wall(program_state, mt_wall_back); // omitted because of camera clipping

            const mt_bed = model_transform.times(Mat4.translation(-40, 3, 10));
            this.models.bed = new Bed_Model(program_state, mt_bed)

            const mt_window = model_transform.times(Mat4.translation(10, -49, -10));
            this.models.window = new Window_Model(program_state, mt_window, 1.3)

            const mt_phone = model_transform.times(Mat4.translation(15, 35, -8));
            this.models.phone = new Phone_Model(program_state, mt_phone, 1)

            let model_id = 1000;
			for (var model_name in this.models) {
				// assign ID to model
				this.models[model_name].id = model_id; // id is used to identify the model from the call to gl.readPixels()
				
				var r = Math.floor(model_id / (255*255));
				var g = Math.floor(model_id / 255) % 256;
				var b = model_id % 256;
				var c = color(r/255,g/255,b/255,1);
				this.models[model_name].id_color = c; // id_color is used to override the model's material color when drawing
				
				model_id++;
			}
        }

        // draw dummy models for mouse picking
        for (var model_name in this.models) {
        	this.models[model_name].draw_dummy(context,program_state);
        }
        
        
        // get model under mouse
        // reference: https://webglfundamentals.org/webgl/lessons/webgl-picking.html
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

// special shader to keep track of model IDs
export class Picking_Shader extends Shader {
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





export class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 5) {
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

