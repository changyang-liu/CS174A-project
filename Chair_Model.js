import {defs, tiny} from './examples/common.js';
import {Picking_Shader, Gouraud_Shader} from './group_project.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

/*
 All models must define:
  - update_state(program_state, model_transform) // if you don't need to modify program_state, just return program_state as is
  - draw(context, program_state) // draws the model normally
  - draw_dummy(context, program_state) // draws a dummy version of the model which uses the mouse_picking dummy material, color set to model ID
  - interact(program_state) // change some internal state of the model
  - update_transform(program_state, model_transform) // can be inlined, but by having it separate we can allow for dynamic/moving models
*/

export class Chair_Model {
	constructor(program_state, model_transform = Mat4.identity(), scale=1) {
		this.scale = scale;
		// Legs
		this.leg_width = 0.2;
		this.leg_length = 2.5;
		// Seat
		this.box_width = 1.0;
		this.box_depth = 1.0;
		this.box_height = 0.2;
		// Back
		this.back_width = 0.1;
		this.back_depth = 1;
		this.back_height= 1.7;
		this.isOn = true;

		this.animation_frame = 0;
		this.animation_max_time = 20;

        this.shapes = {
			chair_seat: new defs.Cube(),
			chair_leg: new defs.Cube(),
			chair_back: new defs.Cube(),
        }
        this.materials = {
            mouse_picking: new Material(new Picking_Shader(),
                {ambient: 0.2, specularity: 1.0, diffusivity: 0.8, color: hex_color("#FFFFFF")}),
        	chair_leg: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0, diffusivity: 0.5, color: hex_color("#75562f")}),
            chair_seat: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0.1, diffusivity: 0.5, color: hex_color("#996f3a")}),
            chair_back: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0.1, diffusivity: 0.5, color: hex_color("#996f3a")}),
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
		this.mt_seat = model_transform.times(Mat4.translation(0,0,this.box_height/2)).times(Mat4.scale(this.box_width+2*(this.leg_width),this.box_depth+2*(this.leg_width),this.box_height));
		model_transform = model_transform.times(Mat4.translation(0,0,-this.leg_length));
		this.mt_back = model_transform.times(Mat4.translation(this.box_width,0,this.back_height/2)).times(Mat4.scale(this.back_width,this.back_depth+2*(this.leg_width),this.back_height));
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
		var mt_translate_back = Mat4.translation(20*cur_progress,0,0);
		var mt_translate_leg = Mat4.translation(10*cur_progress,0,0);
		var mt_translate_seat = Mat4.translation(1.45*cur_progress,0,0);

		this.shapes.chair_leg.draw(context, program_state, this.mt_leg1.times(mt_translate_leg), this.materials.chair_leg);
		this.shapes.chair_leg.draw(context, program_state, this.mt_leg2.times(mt_translate_leg), this.materials.chair_leg);
		this.shapes.chair_leg.draw(context, program_state, this.mt_leg3.times(mt_translate_leg), this.materials.chair_leg);
		this.shapes.chair_leg.draw(context, program_state, this.mt_leg4.times(mt_translate_leg), this.materials.chair_leg);
        
		this.shapes.chair_seat.draw(context, program_state, this.mt_seat.times(mt_translate_seat), this.materials.chair_seat); 
		this.shapes.chair_back.draw(context, program_state, this.mt_back.times(mt_translate_back), this.materials.chair_back);   
	}
	draw_dummy(context, program_state) {
		let dummy_material = this.materials.mouse_picking.override({color: this.id_color});
		
		this.shapes.chair_leg.draw(context, program_state, this.mt_leg1, dummy_material);
		this.shapes.chair_leg.draw(context, program_state, this.mt_leg2, dummy_material);
		this.shapes.chair_leg.draw(context, program_state, this.mt_leg3, dummy_material);
		this.shapes.chair_leg.draw(context, program_state, this.mt_leg4, dummy_material);
        
		this.shapes.chair_seat.draw(context, program_state, this.mt_seat, dummy_material);
		this.shapes.chair_back.draw(context, program_state, this.mt_back, dummy_material);  
		
	}
	interact(program_state) {
		this.isOn ^= 1;
	}
	
}