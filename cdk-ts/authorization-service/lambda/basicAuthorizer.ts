export const handler = async function(event: any) {
    console.log('Auth event: ', event);

    if (!event.authorizationToken) {
        return  getPolicy( 'Deny', event.methodArn, 401)
    }

    const token = event.authorizationToken?.split(' ')[1];
    const buffer = Buffer.from(token, 'base64');
    const [userName, password] = buffer.toString('utf-8').split('=');
    const basicPassword = process.env?.[userName];

    if (password === basicPassword) {
       return  getPolicy('Allow', event.methodArn, 200)
    }

    return getPolicy('Deny', event.methodArn, 403)
};

const getPolicy = (effect: string, resource: string, statusCode: number) => ({
    principalId: 'user',
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
        ],
            context: {
                statusCode: statusCode.toString(),
            },
    },
});
