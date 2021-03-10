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

export class Window_Model {
	constructor(program_state, model_transform = Mat4.identity(), scale=1) {
		this.scale = scale;
		this.isOn = true;

		this.animation_frame = 0;
		this.animation_max_time = 20;

        this.shapes = {
            window: new defs.Square(),
            frame: new defs.Cube(),
            curtain: new defs.Cube(),
            pole: new defs.Capped_Cylinder(7, 10,  [[ .67, 1  ], [ 0,1 ]]),
        }
        this.materials = {
            mouse_picking: new Material(new Picking_Shader(),
                {ambient: 0.2, specularity: 1.0, diffusivity: 0.8, color: hex_color("#FFFFFF")}),
            window: new Material(new defs.Fake_Bump_Map(1), { ambient: .5, texture: new Texture( "assets/outdoors.jpg" ) }),
            curtain: new Material(new defs.Fake_Bump_Map(1), { ambient: .5, texture: new Texture( "assets/curtain.jpg" ) }),
        	frame: new Material(new Gouraud_Shader(),
                {ambient: 0.3, specularity: 0, diffusivity: 0.5, color: hex_color("#d4d4d4")}),
        	pole: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0, diffusivity: 0.5, color: hex_color("#75562f")}),
        }

        this.update_transform(program_state, model_transform);
	}
	// if the position of the object needs to be dynamic, recompute the transformations of its components
    update_transform(program_state, model_transform) {
    	// Given model_transform for initial position of the lamp, set the relative position of the pole/base/lightbulb
    	model_transform = model_transform.times(Mat4.scale(this.scale,this.scale,this.scale));
		model_transform = model_transform.times(Mat4.rotation(-Math.PI/2, 1, 0, 0))
        this.model_transform = model_transform;
        this.mt_window = model_transform.times(Mat4.scale(10, 10, 1));

        const inner_beam_hor = Mat4.scale(10, 0.5, 0.5)
        const inner_beam_vert = Mat4.scale(0.5, 10, 0.5)
        const outer_beam_hor = Mat4.scale(10.1, 0.5, 0.5)
        const outer_beam_vert = Mat4.scale(0.5, 10.5, 0.5)
        this.mt_frame = [
            model_transform.times(inner_beam_hor),
            model_transform.times(inner_beam_vert),
            model_transform.times(Mat4.translation(10, 0, 0)).times(outer_beam_vert),
            model_transform.times(Mat4.translation(-10, 0, 0)).times(outer_beam_vert),
            model_transform.times(Mat4.translation(0, 10, 0)).times(outer_beam_hor),
            model_transform.times(Mat4.translation(0, -10, 0)).times(outer_beam_hor),
        ]

        const curtain_scale = Mat4.scale(5.5, 13, 0.3);
        this.mt_curtain_right = model_transform.times(Mat4.translation(5.5, -2, 1)).times(curtain_scale);
        this.mt_curtain_left = model_transform.times(Mat4.translation(-5.5, -2, 1)).times(curtain_scale);

		this.mt_pole = model_transform.times(Mat4.translation(0, 11.5, 1))
                                      .times(Mat4.rotation(Math.PI/2, 0, 1, 0))
                                      .times(Mat4.scale(0.3, 0.3, 24))
    }
    update_state(program_state) {
		const cur_progress = this.animation_frame/this.animation_max_time;
        console.log(cur_progress)
        const light_transform = this.model_transform.times(Mat4.translation(0, 30, 0))
    	program_state.lights.push(new Light(light_transform.times(vec4(0,0,0,1)), color(1, 1, 1, 1), 1*100000*cur_progress));
    	return program_state;
    }
	draw(context, program_state, model_transform = null) {
		// if the position of the object needs to be dynamic, recompute the transformations of its components
		if (model_transform != null) {
		    this.update_transform(program_state, model_transform);
		}

        this.shapes.window.draw(context, program_state, this.mt_window, this.materials.window);
        this.mt_frame.forEach(transform => {
            this.shapes.frame.draw(context, program_state, transform, this.materials.frame);
        });
        this.shapes.pole.draw(context, program_state, this.mt_pole, this.materials.pole);

		if (this.isOn) {
			if (this.animation_frame > 0)
    			this.animation_frame -= 1;
		} else {
			if (this.animation_frame < this.animation_max_time) {
			this.animation_frame += 1;
            console.log(program_state.lights)
            }
		}

        // Move curtains
        const scale_amt = 1 - 0.6 * (this.animation_frame/this.animation_max_time);
        const translate_amt = 1 - scale_amt;
        const mt_move_right = Mat4.translation(translate_amt, 0, 0).times(Mat4.scale(scale_amt, 1, 1))
        const mt_move_left = Mat4.translation(-translate_amt, 0, 0).times(Mat4.scale(scale_amt, 1, 1))

        this.shapes.curtain.draw(context, program_state, this.mt_curtain_right.times(mt_move_right), this.materials.curtain)
        this.shapes.curtain.draw(context, program_state, this.mt_curtain_left.times(mt_move_left), this.materials.curtain)
	}
	draw_dummy(context, program_state) {
		let dummy_material = this.materials.mouse_picking.override({color: this.id_color});
        this.shapes.window.draw(context, program_state, this.mt_window, dummy_material);
        this.mt_frame.forEach(transform => {
            this.shapes.frame.draw(context, program_state, transform, dummy_material);
        });
        this.shapes.curtain.draw(context, program_state, this.mt_curtain_right, dummy_material)
        this.shapes.curtain.draw(context, program_state, this.mt_curtain_left, dummy_material)
	}
	interact(program_state) {
		this.isOn ^= 1;
	}
}