const Joi=require("joi");

module.exports=Joi.object({

title:Joi.string().required(),

description:Joi.string().required(),

category:Joi.string().required(),

priority:Joi.string().required(),

location:Joi.object({

type:Joi.string().required(),

coordinates:Joi.array().required(),

address:Joi.string().required()

})

});