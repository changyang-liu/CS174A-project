import {defs, tiny} from './examples/common.js';
import {Picking_Shader, Gouraud_Shader} from './group_project.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Flooring {
	constructor(program_state, model_transform = Mat4.identity(), scale=1) {
		this.scale = scale;
		this.length = 25;
		this.width = 25;
		this.resolution_x = 20;
		this.resolution_z = 20;
		
		const initial_corner_point = vec3( -1,-1,0 );
		//flat
		const row_operation = (s,p) => p ? Mat4.translation(0, .2, 0).times(p.to4(1)).to3() : initial_corner_point;
		const column_operation = (t,p) =>  Mat4.translation(.2, 0, 0).times(p.to4(1)).to3();
        
        // smooth bumps
		//const row_operation = (s,p) => p ? Mat4.translation(0, .2, Math.sin(100*s)*Math.random()/2.5).times(p.to4(1)).to3() : initial_corner_point;
		//const column_operation = (t,p) =>  Mat4.translation(.2, 0, Math.sin(100*t)*Math.random()/2.5).times(p.to4(1)).to3();
        
        // "curtain"
		//const row_operation = (s,p) => p ? Mat4.translation( Math.sin(20*s)/10,.2, Math.sin(20*s)/6).times(p.to4(1)).to3() : initial_corner_point;
		//const column_operation = (t,p) =>  Mat4.translation( .2,Math.sin(20*t)/30,Math.sin(20*t)/100).times(p.to4(1)).to3();
		
		this.shapes = { 
			flooring : new defs.Grid_Patch( this.resolution_x, this.resolution_z, row_operation, column_operation ),
        }
        this.materials = {
            mouse_picking: new Material(new Picking_Shader(),
                {ambient: 0.2, specularity: 1.0, diffusivity: 0.8, color: hex_color("#FFFFFF")}),

        	flooring: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0, diffusivity: 1, color: hex_color("#302528")}),
        }

        this.update_transform(program_state, model_transform);
	}
	// if the position of the object needs to be dynamic, recompute the transformations of its components
    update_transform(program_state, model_transform) {
    	// Given model_transform for initial position of the lamp, set the relative position of the pole/base/lightbulb
    	model_transform = model_transform.times(Mat4.scale(this.scale,this.scale,this.scale));
		this.model_transform = model_transform
		// resolution of grid expands to the positive x-z direction, so translate it back to center it
		this.mt_flooring = model_transform.times(Mat4.translation(-this.length,-this.width,0)).times(Mat4.scale(this.length,this.width,1));
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
		this.shapes.flooring.draw(context, program_state, this.mt_flooring, this.materials.flooring);
	}
	draw_dummy(context, program_state) {
		let dummy_material = this.materials.mouse_picking.override({color: this.id_color});
		this.shapes.flooring.draw(context, program_state, this.mt_flooring, dummy_material);
	}
	interact(program_state) {
		return;
	}
}