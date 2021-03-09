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

export class Drawer_Model {
	constructor(program_state, model_transform = Mat4.identity(), scale=1) {
		this.scale = scale;
		this.leg_width = 0.3;
		this.leg_length = 5;
		this.box_width = 1.5;
		this.box_depth = 1.5;
		this.box_height = 2.5;
		this.isOn = false;

		this.animation_frame = 0;
		this.animation_max_time = 20;

        this.shapes = {
        	//drawer_leg: new (defs.Cylindrical_Tube.prototype.make_flat_shaded_version())( 7, 10,  [[ .67, 1  ], [ 0,1 ]] ),
			drawer_box: new defs.Cube(),
			drawer_leg: new defs.Cube(),
			drawer_drawer: new defs.Open_Cube()
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
		
		if (!this.isOn) {
			if (this.animation_frame > 0)
    			this.animation_frame -= 1;
		} else {
			if (this.animation_frame < this.animation_max_time)
			this.animation_frame += 1;
		}
		var cur_progress = this.animation_frame/this.animation_max_time;
		var mt_translate = Mat4.translation(0,9*cur_progress+1,0);
		var mt_open = Mat4.translation(0,5*cur_progress+1,0).times(Mat4.scale(1,4*cur_progress+1,1));

        this.shapes.drawer_drawer.draw(context, program_state, this.mt_drawer1.times(mt_open), this.materials.drawer_drawer);
		this.shapes.drawer_drawer.draw(context, program_state, this.mt_drawer2.times(mt_open), this.materials.drawer_drawer);
		this.shapes.drawer_box.draw(context, program_state, this.mt_handle1.times(mt_translate), this.materials.drawer_handle);
		this.shapes.drawer_box.draw(context, program_state, this.mt_handle2.times(mt_translate), this.materials.drawer_handle);
		/*
		if (!this.isOn){
			if (this.animation_frame > 0)
			    this.animation_frame -= 1;
			    
		this.shapes.drawer_box.draw(context, program_state, this.mt_drawer1, this.materials.drawer_drawer);
		this.shapes.drawer_box.draw(context, program_state, this.mt_drawer2, this.materials.drawer_drawer);
		this.shapes.drawer_box.draw(context, program_state, this.mt_handle1, this.materials.drawer_handle);
		this.shapes.drawer_box.draw(context, program_state, this.mt_handle2, this.materials.drawer_handle);
		} else {
			//console.log(this.animation_frame);
			if (this.animation_frame < this.animation_max_time)
    			this.animation_frame += 1;
    		var cur_progress = this.animation_frame/this.animation_max_time;
			var mt_translate = Mat4.translation(0,8*cur_progress,0);
			var mt_open = Mat4.translation(0,5*cur_progress,0).times(Mat4.scale(1,4*cur_progress,1));
			this.shapes.drawer_drawer.draw(context, program_state, this.mt_drawer1.times(mt_open), this.materials.drawer_drawer);
		    this.shapes.drawer_drawer.draw(context, program_state, this.mt_drawer2.times(mt_open), this.materials.drawer_drawer);
		    this.shapes.drawer_box.draw(context, program_state, this.mt_handle1.times(mt_translate), this.materials.drawer_handle);
		    this.shapes.drawer_box.draw(context, program_state, this.mt_handle2.times(mt_translate), this.materials.drawer_handle);
		}
		*/
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