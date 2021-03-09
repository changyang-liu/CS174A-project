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

export class Bed_Model {
	constructor(program_state, model_transform = Mat4.identity(), scale=1) {
		this.scale = scale;
		this.isOn = false;

        this.bed_length = 30;
        this.bed_width = 16;

        this.headboard_height = 14;
        this.footboard_height = 10;
        this.board_thickness = 0.3;

        this.mattress_height = 4;
        this.cover_len = 20;

		this.animation_frame = 0;
		this.animation_max_time = 20;

        this.shapes = {
        	//drawer_leg: new (defs.Cylindrical_Tube.prototype.make_flat_shaded_version())( 7, 10,  [[ .67, 1  ], [ 0,1 ]] ),
			drawer_box: new defs.Cube(),
			drawer_leg: new defs.Cube(),
			drawer_drawer: new defs.Open_Cube(),
            headboard: new defs.Cube(),
            board: new defs.Cube(),
            mattress: new defs.Cube(),
            pillow: new defs.Cube(),
            cover: new defs.Square(),
            sheet: new defs.Square(),
        }
        this.materials = {
            mouse_picking: new Material(new Picking_Shader(),
                {ambient: 0.2, specularity: 1.0, diffusivity: 0.8, color: hex_color("#FFFFFF")}),
        	board: new Material(new Gouraud_Shader(),
                {ambient: 0, specularity: 0, diffusivity: 0.5, color: hex_color("#75562f")}),
        	linen: new Material(new Gouraud_Shader(),
                {ambient: 0.1, specularity: 0, diffusivity: 0.5, color: hex_color("#ffffff")}),
        	cover: new Material(new Gouraud_Shader(),
                {ambient: 0.1, specularity: 0, diffusivity: 0.5, color: hex_color("#b32525")}),
        }

        this.update_transform(program_state, model_transform);
	}
	update_transform(program_state, model_transform) {
		model_transform = model_transform.times(Mat4.scale(this.scale,this.scale,this.scale));
		this.model_transform = model_transform;

        this.mt_base = model_transform.times(Mat4.scale(this.bed_width/2, this.bed_length/2, this.board_thickness))

        this.mt_footboard = model_transform.times(Mat4.translation(0, this.bed_length/2, -this.footboard_height/2 + 4))
                                           .times(Mat4.scale(this.bed_width/2, this.board_thickness, this.footboard_height/2));

        this.mt_headboard = model_transform.times(Mat4.translation(0, -this.bed_length/2, -this.headboard_height/2 + 4))
                                           .times(Mat4.scale(this.bed_width/2, this.board_thickness, this.headboard_height/2));

        this.mt_mattress = model_transform.times(Mat4.translation(0, 0, -this.mattress_height/2))
                                          .times(Mat4.scale(this.bed_width/2, this.bed_length/2, this.mattress_height/2));
        this.mt_pillow = model_transform.times(Mat4.translation(0, -this.bed_length/2 + 3, -this.mattress_height - 1))
                                        .times(Mat4.scale(5, 3, 1));

        this.mt_cover_top = model_transform.times(Mat4.translation(0, this.cover_len/4, -4.1))
                                           .times(Mat4.scale(8, this.cover_len/2, 1));
        this.mt_cover_side = model_transform.times(Mat4.translation(this.bed_width/2 + .1, 5, -1.05))
                                            .times(Mat4.rotation(Math.PI/2, 0, 1, 0))
                                            .times(Mat4.scale(3, this.cover_len/2, 1));

        this.mt_sheet_top = model_transform.times(Mat4.translation(0, -6, -4.2))
                                           .times(Mat4.scale(this.bed_width/2, 1.5, 1));
        this.mt_sheet_side = model_transform.times(Mat4.translation(this.bed_width/2 + .2, -6, -1.05))
                                            .times(Mat4.rotation(Math.PI/2, 0, 1, 0))
                                            .times(Mat4.scale(3, 1.5, 1));
    }
    update_state(program_state) {
    	return program_state;
    }
	draw(context, program_state, model_transform = null) {
		// if the position of the object needs to be dynamic, recompute the transformations of its components
		if (model_transform != null) {
		    this.update_transform(program_state, model_transform);
		}

        // Bed frame
        this.shapes.board.draw(context, program_state, this.mt_headboard, this.materials.board);
        this.shapes.board.draw(context, program_state, this.mt_footboard, this.materials.board);
        this.shapes.board.draw(context, program_state, this.mt_base, this.materials.board);

        // Mattress and pillow
        this.shapes.mattress.draw(context, program_state, this.mt_mattress, this.materials.linen);
        this.shapes.pillow.draw(context, program_state, this.mt_pillow, this.materials.linen);

		if (!this.isOn) {
			if (this.animation_frame > 0)
    			this.animation_frame -= 1;
		} else {
			if (this.animation_frame < this.animation_max_time)
                this.animation_frame += 1;
		}
        const scale_amt = 1 - 0.6 * (this.animation_frame/this.animation_max_time);

        // Move covers
        const translate_amt = (this.cover_len - 2) * (1 - scale_amt);
        const mt_scale = Mat4.scale(1, scale_amt, 1)
		const mt_translate = Mat4.translation(0, translate_amt, 0);
        this.shapes.cover.draw(
            context, program_state,
            mt_translate.times(mt_scale).times(this.mt_cover_top),
            this.materials.cover
        )
        this.shapes.cover.draw(
            context,
            program_state,
            mt_translate.times(mt_scale).times(this.mt_cover_side),
            this.materials.cover
        )

        // Move sheet
        const translate_amt_sheet = this.cover_len * (1 - scale_amt);
        const mt_translate_sheet = Mat4.translation(0, translate_amt_sheet, 0)

        this.shapes.sheet.draw(
            context,
            program_state, mt_translate_sheet.times(this.mt_sheet_top),
            this.materials.linen
        )
        this.shapes.sheet.draw(
            context,
            program_state,
            mt_translate_sheet.times(this.mt_sheet_side),
            this.materials.linen
        )
	}
	draw_dummy(context, program_state) {
		let dummy_material = this.materials.mouse_picking.override({color: this.id_color});
		
        this.shapes.board.draw(context, program_state, this.mt_headboard, dummy_material);
        this.shapes.board.draw(context, program_state, this.mt_footboard, dummy_material);
        this.shapes.board.draw(context, program_state, this.mt_base, dummy_material);

        this.shapes.mattress.draw(context, program_state, this.mt_mattress, dummy_material);
        this.shapes.pillow.draw(context, program_state, this.mt_pillow, dummy_material);

        this.shapes.cover.draw(context, program_state, this.mt_cover_top, dummy_material)
        this.shapes.cover.draw(context, program_state, this.mt_cover_side, dummy_material)

        this.shapes.sheet.draw(context, program_state, this.mt_sheet_top, dummy_material)
        this.shapes.sheet.draw(context, program_state, this.mt_sheet_side, dummy_material)
	}

	interact(program_state) {
		this.isOn ^= 1;
	}
	
}