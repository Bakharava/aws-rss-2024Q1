export const setResponse = (
    statusCode: number = 200,
    body = {},
) => {
    return {
        statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
            "Content-Type": "application/json",
        },
        body: body,
    };
};

export const handler = async function(event: any) {
    console.log('Auth event: ', event);

    const token = event.authorizationToken?.split(' ')[1];
    console.log('Token: ', token)

    if (!event.authorizationToken || !token || token === 'null' || token === 'undefined') {
        console.log('Authorization DENY, status code 401')

        return getPolicy( 'Deny', event.methodArn)
    }

    const buffer = Buffer.from(token, 'base64');
    const [userName, password] = buffer.toString('utf-8').split('=');
    console.log('userName ', userName)
    console.log('Password: ', password)
    const basicPassword = process.env[userName];
    console.log('basicPassword: ', basicPassword)

    if (password && basicPassword && password === basicPassword) {
        console.log('Authorization ALLOW, status code 200')

        return getPolicy('Allow', event.methodArn)
    }

    console.log('Authorization DENY, status code 403')

    return getPolicy('Deny', event.methodArn)
};

const getPolicy = (effect: string, resource: string) => ({
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
    },
});
