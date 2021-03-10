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

export class Door_Model {
	constructor(program_state, model_transform = Mat4.identity(), scale=1) {
		this.scale = scale;
		this.door_width = 0.2;
		this.door_depth = 3;
		this.door_height= 6;
		this.isOn = true;

		this.animation_frame = 0;
		this.animation_max_time = 20;


        this.shapes = {
			door_front1: new defs.Cube(),
			door_front2: new defs.Cube(),
			door_knob1: new defs.Cube(),
			door_knob2: new defs.Cube(),
        }
        this.materials = {
            mouse_picking: new Material(new Picking_Shader(),
                {ambient: 0.2, specularity: 1.0, diffusivity: 0.8, color: hex_color("#FFFFFF")}),
            door_front1: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0.1, diffusivity: 0.5, color: hex_color("#996f3a")}),
            door_knob1: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 1.0, diffusivity: 1.0, color: hex_color("#3d352b")}),
            door_front2: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0.1, diffusivity: 0.5, color: hex_color("#996f3a")}),
            door_knob2: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 1.0, diffusivity: 1.0, color: hex_color("#3d352b")}),
        }

        this.update_transform(program_state, model_transform);
	}
	update_transform(program_state, model_transform) {
		model_transform = model_transform.times(Mat4.scale(this.scale,this.scale,this.scale));
		this.model_transform = model_transform;
		
		this.mt_front1 = model_transform.times(Mat4.translation(this.door_width,0,this.door_height/2))
		                      .times(Mat4.scale(this.door_width,this.door_depth,this.door_height));
        this.mt_knob1 = model_transform.times(Mat4.translation(-0.1, 2.3,this.door_height/2))
		                      .times(Mat4.scale(0.05,0.2,0.4));

        model_transform = model_transform.times(Mat4.translation(0,this.door_depth+3.2,0));
        this.mt_front2 = model_transform.times(Mat4.translation(this.door_width,0,this.door_height/2))
		                      .times(Mat4.scale(this.door_width,this.door_depth,this.door_height));
        this.mt_knob2 = model_transform.times(Mat4.translation(-0.1, -2.3,this.door_height/2))
		                      .times(Mat4.scale(0.05,0.2,0.4));
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
            if (this.animation_frame > 0)
    			this.animation_frame -= 1;
		} else {
			if (this.animation_frame < this.animation_max_time)
			this.animation_frame += 1;
		}

		var cur_progress = this.animation_frame/this.animation_max_time;
		let mt_translate_left = Mat4.translation(0,-cur_progress,0);
		let mt_translate_right = Mat4.translation(0,cur_progress,0);

		let mt_translate_left_knob = Mat4.translation(0,-cur_progress*15,0);
		let mt_translate_right_knob = Mat4.translation(0,cur_progress*15,0);

		this.shapes.door_front1.draw(context, program_state, this.mt_front1.times(mt_translate_left), this.materials.door_front1); 
		this.shapes.door_knob1.draw(context, program_state, this.mt_knob1.times(mt_translate_left_knob), this.materials.door_knob1);

		this.shapes.door_front2.draw(context, program_state, this.mt_front2.times(mt_translate_right), this.materials.door_front2); 
		this.shapes.door_knob2.draw(context, program_state, this.mt_knob2.times(mt_translate_right_knob), this.materials.door_knob2);
	}
	draw_dummy(context, program_state) {
		let dummy_material = this.materials.mouse_picking.override({color: this.id_color});
		this.shapes.door_knob1.draw(context, program_state, this.mt_knob1, dummy_material);  
		this.shapes.door_knob2.draw(context, program_state, this.mt_knob2, dummy_material);

		this.shapes.door_front1.draw(context, program_state, this.mt_front1, dummy_material);  
		this.shapes.door_front2.draw(context, program_state, this.mt_front2, dummy_material);  	
	}
	interact(program_state) {
		this.isOn ^= 1;
	}
	
}