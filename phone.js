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

export class Phone_Model {
	constructor(program_state, model_transform = Mat4.identity(), scale=1) {
		this.scale = scale;
		this.isOn = true;

		this.animation_frame = 0;
		this.animation_max_time = 20;

        this.shapes = {
            button: new defs.Capped_Cylinder(7, 10,  [[ .67, 1  ], [ 0,1 ]]),
            casing: new defs.Cube(),
            screen: new defs.Square(),
        }
        this.materials = {
            mouse_picking: new Material(new Picking_Shader(),
                {ambient: 0.2, specularity: 1.0, diffusivity: 0.8, color: hex_color("#FFFFFF")}),
        	casing: new Material(new Gouraud_Shader(),
                {ambient: 0.4, specularity: 1, diffusivity: 0.3, color: hex_color("#a6a6a6")}),
        	screen: new Material(new Gouraud_Shader(),
                {ambient: 0.4, specularity: 1, diffusivity: 0.3, color: hex_color("#000000")}),
            screen_on: new Material(new defs.Fake_Bump_Map(1),
                { ambient: 1, texture: new Texture( "assets/lock_screen.jpg" ) }),
        	button: new Material(new Gouraud_Shader(),
                {ambient: 0.4, specularity: 1, diffusivity: 0.3, color: hex_color("#000000")}),
        }

        this.update_transform(program_state, model_transform);
	}
	// if the position of the object needs to be dynamic, recompute the transformations of its components
    update_transform(program_state, model_transform) {
    	// Given model_transform for initial position of the lamp, set the relative position of the pole/base/lightbulb
    	model_transform = model_transform.times(Mat4.scale(this.scale,this.scale,this.scale));
        this.model_transform = model_transform;

        this.mt_phone = model_transform.times(Mat4.scale(1.5, 2, 0.1));
        this.mt_screen = model_transform.times(Mat4.translation(0, 0, -0.11))
                                        .times(Mat4.scale(1.275, 1.7, 0.1))
                                        .times(Mat4.rotation(Math.PI, 1, 0, 0))
        this.mt_button = model_transform.times(Mat4.translation(0, 1.85, 0))
                                        .times(Mat4.scale(0.1, 0.1, 0.22))
    }
    update_state(program_state) {
		const cur_progress = this.animation_frame/this.animation_max_time;
        const light_transform = this.model_transform.times(Mat4.translation(0, 10, 0))
    	program_state.lights.push(new Light(light_transform.times(vec4(0,0,0,1)), color(1, 1, 1, 1), 1*100000*cur_progress));
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
        const progress = this.animation_frame/this.animation_max_time
        const angle = progress * Math.PI/2;
        const displacement = progress * 2;

        const movement = Mat4.translation(0, displacement, -displacement).times(Mat4.rotation(angle, 1, 0, 0));
        const mt_phone = this.model_transform.times(movement)
                                             .times(Mat4.inverse(this.model_transform))
                                             .times(this.mt_phone);
        const mt_screen = this.model_transform.times(movement)
                                             .times(Mat4.inverse(this.model_transform))
                                             .times(this.mt_screen);
        const mt_button = this.model_transform.times(movement)
                                              .times(Mat4.inverse(this.model_transform))
                                              .times(this.mt_button);
                                    
        this.shapes.casing.draw(context, program_state, mt_phone, this.materials.casing);
        this.shapes.screen.draw(context, program_state, mt_screen,
                                this.isOn ? this.materials.screen : this.materials.screen_on);
        this.shapes.button.draw(context, program_state, mt_button, this.materials.button);
	}
	draw_dummy(context, program_state) {
		let dummy_material = this.materials.mouse_picking.override({color: this.id_color});

        const progress = this.animation_frame/this.animation_max_time
        const angle = progress * Math.PI/2;
        const displacement = progress * 2;

        const movement = Mat4.translation(0, displacement, 0).times(Mat4.rotation(angle, 1, 0, 0));
        const mt_phone = this.model_transform.times(movement)
                                             .times(Mat4.inverse(this.model_transform))
                                             .times(this.mt_phone);

        this.shapes.casing.draw(context, program_state, mt_phone, dummy_material);
	}
	interact(program_state) {
		this.isOn ^= 1;
	}
}