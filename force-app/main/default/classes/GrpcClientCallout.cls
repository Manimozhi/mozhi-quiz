public class GrpcClientCallout {
    public static Decimal calculate(Decimal firstOperand, Decimal secondOperand, String operation) {
        // Replace with the actual URL of your deployed intermediary Cloud Run service
        String endpoint = 'https://grpc-intermediary-service-xyz-uc.a.run.app/calculate'; 

        HttpRequest req = new HttpRequest();
        req.setMethod('POST');
        req.setEndpoint(endpoint);
        req.setHeader('Content-Type', 'application/json;charset=UTF-8');
        req.setBody(
            JSON.serialize(new Map<String, Object>{
                'first_operand' => firstOperand,
                'second_operand' => secondOperand,
                'operation' => operation
            })
        );
        
        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            return (Decimal) result.get('result');
        } else {
            System.debug('Error calling intermediary service: ' + res.getStatusCode() + ' - ' + res.getStatus());
            return null;
        }
    }
}