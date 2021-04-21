import { NotFoundError, ValidationError } from "./error";
import { User } from "./schema";
import { Levels } from "./types";
import { baseLogger } from "./utils";

const logger = baseLogger.child({module: "admin"})

export abstract class AdminOps {

  static async usernameExists({ username }): Promise<boolean> {
    return !!(await User.findByUsername({ username }))
  }

  static async setLevel({ uid, level }) {
    if(Levels.indexOf(level) === -1) {
      const error = `${level} is not a valid user level`
      throw new LoggedError(error)
    }
    return User.findOneAndUpdate({ _id: uid }, { $set: { level } }, {new: true})
  }

  static async addToMap({ username, latitude, longitude, title, }): Promise<boolean> {
    if(!username || !latitude || !longitude || !title) {
      throw new LoggedError(`missing input for ${username}: ${latitude}, ${longitude}, ${title}`);
    }

    const user = await User.findByUsername({ username });

    if(!user) {
      throw new LoggedError(`The user ${username} does not exist`);
    }

    user.coordinate = {
      latitude,
      longitude
    };

    user.title = title
    return !!(await user.save());
  }

  static async setAccountStatus({ uid, status }): Promise<typeof User> {
    const user = await User.findOne({ _id: uid })

    user.status = status
    return user.save()
  }

}
