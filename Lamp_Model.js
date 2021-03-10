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

export class Lamp_Model {
	constructor(program_state, model_transform = Mat4.identity(), scale=1, rod_length) {
		this.scale = scale;
		this.isOn = true;
		this.rod_length = rod_length;

		this.animation_frame = 0;
		this.animation_max_time = 20;

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