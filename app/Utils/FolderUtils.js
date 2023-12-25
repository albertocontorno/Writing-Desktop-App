"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.directory_read = void 0;
const path = require("path");
const fs = require("fs/promises");
const FolderStructure_model_1 = require("../models/FolderStructure.model");
function directory_read(dirPath, filelist = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield fs.readdir(dirPath, { withFileTypes: true });
        for (let file of files) {
            const filepath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                const children = [];
                filelist.push(new FolderStructure_model_1.FolderStructure(filepath, file.name, 'FOLDER', children));
                yield directory_read(filepath, children);
            }
            else if (file.isSymbolicLink()) {
                filelist.push(new FolderStructure_model_1.FolderStructure(filepath, file.name, 'SYMLINK'));
            }
            else {
                filelist.push(new FolderStructure_model_1.FolderStructure(filepath, file.name, 'FILE'));
            }
        }
        return filelist;
    });
}
exports.directory_read = directory_read;
//# sourceMappingURL=FolderUtils.js.map