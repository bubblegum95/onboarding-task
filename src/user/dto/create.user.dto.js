import Joi from "joi";

const CreateUserDto = Joi.object({
  username: Joi.string().min(2).required(),
  nickname: Joi.string().min(2).required(),
  password: Joi.string().min(4).max(16).required(),
});

export default CreateUserDto;
