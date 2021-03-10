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

export class Table_Model {
	constructor(program_state, model_transform = Mat4.identity(), scale=1) {
		this.scale = scale;
		this.leg_width = 0.3;
		this.leg_length = 5;
		this.box_width = 2.0;
		this.box_depth = 6.0;
		this.box_height = 0.3;
		this.isOn = false;

		this.animation_frame = 0;
		this.animation_max_time = 20;

        this.shapes = {
			table_top: new defs.Cube(),
			table_leg: new defs.Cube(),
			keyboard: new defs.Cube()
        }
        this.materials = {
            mouse_picking: new Material(new Picking_Shader(),
                {ambient: 0.2, specularity: 1.0, diffusivity: 0.8, color: hex_color("#FFFFFF")}),
        	table_leg: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0, diffusivity: 0.5, color: hex_color("#75562f")}),
            table_top: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0.1, diffusivity: 0.5, color: hex_color("#996f3a")}),
            keyboard: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0.1, diffusivity: 0.5, color: hex_color("#8a999c")}),
             
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
		this.mt_keeb = model_transform.times(Mat4.translation(0,0,this.box_height/2-0.45)).times(Mat4.scale(this.box_width/3,this.box_depth/3,this.box_height/3));
		
		
    }
    update_state(program_state) {
    	return program_state;
    }
	draw(context, program_state, model_transform = null) {
		// if the position of the object needs to be dynamic, recompute the transformations of its components
		if (model_transform != null) {
		    this.update_transform(program_state, model_transform);
		}

		this.shapes.table_leg.draw(context, program_state, this.mt_leg1, this.materials.table_leg);
		this.shapes.table_leg.draw(context, program_state, this.mt_leg2, this.materials.table_leg);
		this.shapes.table_leg.draw(context, program_state, this.mt_leg3, this.materials.table_leg);
		this.shapes.table_leg.draw(context, program_state, this.mt_leg4, this.materials.table_leg);
        
		this.shapes.table_top.draw(context, program_state, this.mt_body, this.materials.table_top);
		this.shapes.keyboard.draw(context, program_state, this.mt_keeb, this.materials.keyboard);   
	}
	draw_dummy(context, program_state) {
		let dummy_material = this.materials.mouse_picking.override({color: this.id_color});
		
		this.shapes.table_leg.draw(context, program_state, this.mt_leg1, dummy_material);
		this.shapes.table_leg.draw(context, program_state, this.mt_leg2, dummy_material);
		this.shapes.table_leg.draw(context, program_state, this.mt_leg3, dummy_material);
		this.shapes.table_leg.draw(context, program_state, this.mt_leg4, dummy_material);
        
		this.shapes.table_top.draw(context, program_state, this.mt_body, dummy_material);
		
	}
	interact(program_state) {
		this.isOn ^= 1;
	}
	
}