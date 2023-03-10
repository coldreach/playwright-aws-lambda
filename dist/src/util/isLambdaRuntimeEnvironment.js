"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isLambdaRuntimeEnvironment() {
    return [
        'AWS_Lambda_nodejs10.x',
        'AWS_Lambda_nodejs12.x',
        'AWS_Lambda_nodejs14.x',
        'AWS_Lambda_nodejs16.x',
        'AWS_Lambda_nodejs18.x',
    ].includes(process.env.AWS_EXECUTION_ENV);
}
exports.default = isLambdaRuntimeEnvironment;
