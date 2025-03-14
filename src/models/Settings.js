import mongoose from "mongoose";
const { Schema } = mongoose;

const PermissionsSchema = new Schema({
    name: { type: String, require: true, unique: true },
    status: { type: Boolean, require: true, default: true },
}, { _id: false });

const RoleSchema = new Schema([{
    name: { type: String, required: true, unique: true },
    permissions: [
        {
            name: { type: String, required: true },
            pages: [{ type: String }]
        }
    ],
    status: { type: Boolean, default: true } // Active or not
}, { _id: false }]);

const SettingsSchema = new Schema({
    permissions: { type: [PermissionsSchema], require: true },
    roles: { type: [RoleSchema], require: true },
})

const Settings = mongoose.model('Settings', SettingsSchema);
export default Settings;