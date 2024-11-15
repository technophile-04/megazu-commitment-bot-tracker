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
exports.acquireLock = acquireLock;
exports.releaseLock = releaseLock;
function acquireLock(lockRef_1) {
    return __awaiter(this, arguments, void 0, function* (lockRef, maxWaitTime = 10000, db) {
        const lockExpiration = Date.now() + 10000; // Lock expires after 10 seconds
        const result = yield db.runTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
            const doc = yield transaction.get(lockRef);
            if (!doc.exists || doc.data().expiresAt < Date.now()) {
                transaction.set(lockRef, { expiresAt: lockExpiration });
                return true;
            }
            return false;
        }));
        if (result)
            return true;
        // If we couldn't acquire the lock, wait and try again
        if (maxWaitTime > 0) {
            yield new Promise((resolve) => setTimeout(resolve, 100));
            return acquireLock(lockRef, maxWaitTime - 100, db);
        }
        return false;
    });
}
function releaseLock(lockRef) {
    return __awaiter(this, void 0, void 0, function* () {
        yield lockRef.delete();
    });
}
