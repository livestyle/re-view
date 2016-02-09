/**
 * A deferred constructor, based on Promises
 */
export default function(executor) {
    var out = {};
    out.promise = new Promise((resolve, reject) => {
        out.resolve = resolve;
        out.reject = reject;
        if (typeof executor === 'function') {
            return executor(resolve, reject);
        }
    });
    return out;
}
