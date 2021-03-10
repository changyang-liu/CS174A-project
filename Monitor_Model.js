import {defs, tiny} from './examples/common.js';
import {Picking_Shader, Gouraud_Shader} from './group_project.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

/*
 All models must define:
  - update_state(program_state, model_transform) // if you don't need to modify program_state, just return program_state as is
  - draw(context, program_state) // draws the model normally
  - draw_dummy(context, program_state) // draws a dummy version of the model which uses the mouse_picking dummy material, color set to model ID
  - interact(program_state) // change some internal state of the model
  - update_transform(program_state, model_transform) // can be inlined, but by having it separate we can allow for dynamic/moving models
*/

export class Monitor_Model {
	constructor(program_state, model_transform = Mat4.identity(), scale=1) {
		this.scale = scale;
		this.monitor_width = 0.1;
		this.monitor_depth = 4;
		this.monitor_height= 1.7;
		this.isOn = false;

		this.animation_frame = 0;
		this.animation_max_time = 20;

		const texture = new defs.Textured_Phong( 1 );

        this.shapes = {
			monitor_back: new defs.Cube(),
			monitor_front: new defs.Cube()
        }
        this.materials = {
            mouse_picking: new Material(new Picking_Shader(),
                {ambient: 0.2, specularity: 1.0, diffusivity: 0.8, color: hex_color("#FFFFFF")}),
            monitor_back: new Material(new Gouraud_Shader(),
                {ambient: 0.2, specularity: 0.1, diffusivity: 0.5, color: hex_color("#8a999c")}),
            monitor_front: new Material(texture,
                {ambient: 0, specularity: 0.1, diffusivity: 0.5, color: hex_color("#000000"), texture: new Texture( "assets/goodflix.png" )}),
        }

        this.update_transform(program_state, model_transform);
	}
	update_transform(program_state, model_transform) {
		model_transform = model_transform.times(Mat4.scale(this.scale,this.scale,this.scale));
		this.model_transform = model_transform;
		this.mt_back = model_transform.times(Mat4.translation(this.monitor_width,0,this.monitor_height/2))
		                      .times(Mat4.scale(this.monitor_width,this.monitor_depth,this.monitor_height));
		this.mt_front = model_transform.times(Mat4.translation(this.monitor_width+0.1,0,this.monitor_height/2))
		                      .times(Mat4.scale(this.monitor_width*0.9,this.monitor_depth*0.95,this.monitor_height*0.9));
    }
    update_state(program_state) {
    	var cur_progress = 1 - this.animation_frame/this.animation_max_time;
    	program_state.lights.push(new Light(this.model_transform.times(vec4(0,0,0,1)), color(1, 0.8, 0.8, 1), 1*1000*cur_progress));
    	return program_state;
    }
	draw(context, program_state, model_transform = null) {
		// if the position of the object needs to be dynamic, recompute the transformations of its components
		if (model_transform != null) {
		    this.update_transform(program_state, model_transform);
		}
		var cur_progress = 1 - this.animation_frame/this.animation_max_time;
		let lamp_ambient = 0.2 + 0.6*cur_progress;
		
		if (this.isOn) {
            if (this.animation_frame > 0)
    			this.animation_frame -= 1;
		} else {
			if (this.animation_frame < this.animation_max_time)
			this.animation_frame += 1;
		}
		this.shapes.monitor_back.draw(context, program_state, this.mt_back, this.materials.monitor_back); 
		this.shapes.monitor_front.draw(context, program_state, this.mt_front, this.materials.monitor_front.override({ambient: lamp_ambient})); 
	}
	draw_dummy(context, program_state) {
		let dummy_material = this.materials.mouse_picking.override({color: this.id_color});
		this.shapes.monitor_front.draw(context, program_state, this.mt_front, dummy_material);  
		
	}
	interact(program_state) {
		this.isOn ^= 1;
	}
	
}