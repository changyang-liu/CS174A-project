import {defs, tiny} from './examples/common.js';
import {Picking_Shader, Gouraud_Shader} from './group_project.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Wall {
	constructor(program_state, model_transform = Mat4.identity(), scale=1) {
		this.scale = scale;
		this.length = 40;
		this.height = 25;
		
		this.shapes = { 
			wall : new defs.Cube()
        }
        this.materials = {
            mouse_picking: new Material(new Picking_Shader(),
                {ambient: 0.2, specularity: 1.0, diffusivity: 0.8, color: hex_color("#FFFFFF")}),

        	wall: new Material(new Gouraud_Shader(),
                {ambient: 0.02, specularity: 0.9, diffusivity: 1.0, color: hex_color("#33131c")}),
        }

        this.update_transform(program_state, model_transform);
	}
	// if the position of the object needs to be dynamic, recompute the transformations of its components
    update_transform(program_state, model_transform) {
    	// Given model_transform for initial position of the lamp, set the relative position of the pole/base/lightbulb
    	model_transform = model_transform.times(Mat4.scale(this.scale,this.scale,this.scale));
		this.model_transform = model_transform
		this.mt_wall = model_transform.times(Mat4.translation(0,0,-this.height+0.5)).times(Mat4.scale(0.5,this.length,this.height));
    }
    update_state(program_state) {
    	return program_state;
    }
	draw(context, program_state, model_transform = null) {
		// if the position of the object needs to be dynamic, recompute the transformations of its components
		if (model_transform != null) {
		    this.update_transform(program_state, model_transform);
		}
		
        // light source translated to center of lamp (at bulb)
		this.shapes.wall.draw(context, program_state, this.mt_wall, this.materials.wall);
	}
	draw_dummy(context, program_state) {
		let dummy_material = this.materials.mouse_picking.override({color: this.id_color});
		this.shapes.wall.draw(context, program_state, this.mt_wall, dummy_material);
	}
	interact(program_state) {
		return;
	}
}