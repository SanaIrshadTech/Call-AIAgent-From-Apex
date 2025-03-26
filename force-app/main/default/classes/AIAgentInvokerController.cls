/**********************************************************************************************************
Apex Class Name    : AIAgentInvokerController
Created Date       : March 22, 2025
@author            : Sana Irshad
@description       : This is class is used to invoke Agentforce agent actions and return the response 
				  	 to LWC 'caseDashboardLwc'
Modification Log   :
Ver   Date         Author                               Modification
1.0   22-03-2025   Sana Irshad                          Initial Version
***********************************************************************************************************/
public class AIAgentInvokerController {
    
    //Wrapper class to store the Agent response details
    public class AgentResponseWrapper {
        @AuraEnabled
        public String type;
        @AuraEnabled
        public String value;
        @AuraEnabled
        public Boolean isSuccess;
        @AuraEnabled
        public String agentSessionId;
    }

	/****************************************************************************************************
	* @Method Name    : invokeAgentActionMethod
	* @description    : method to invoke different Invocable actions from apex code using Invocable.Action
	* @param          : userPrompt - Holds different user prompts to inject in agent
	*					agentSessionId - Holds the session ID of the agent to maintain sessions for 
	*					subsequent action invocations.
	* @return         : AgentResponseWrapper - Wrapper having the agent response to be use in LWC.
	*****************************************************************************************************/    
    @AuraEnabled
    public static AgentResponseWrapper invokeAgentActionMethod(String userPrompt, String agentSessionId) {
        
        try {
            
            AgentResponseWrapper agentResponseWrapperObj = new AgentResponseWrapper();

            /* To invoke an agent in the apex, create an instance of the invocable action with 
			*  type : ‘generateAiAgentResponse’ and 
            *  name : mention your agent name eg, ‘Agentforce_Service_Agent_new’*/
            Invocable.Action action = Invocable.Action.createCustomAction('generateAiAgentResponse', 'Copilot_for_Salesforce_883102392728379');
            
            action.setInvocationParameter('userMessage', userPrompt); 
            if(String.isNotEmpty(agentSessionId)) {
                action.setInvocationParameter('sessionId', agentSessionId);            
            }
            
            List<Invocable.Action.Result> resultList = action.invoke();
            Invocable.Action.Result result = resultList[0];
            List<Invocable.Action.Error> errorList;

            if (result.isSuccess()) {
                agentResponseWrapperObj = (AgentResponseWrapper) JSON.deserialize(String.valueOf(result.getOutputParameters().get('agentResponse')),AgentResponseWrapper.Class);
                agentResponseWrapperObj.isSuccess = true;
                if(String.isEmpty(agentSessionId)) {                    
                    agentResponseWrapperObj.agentSessionId = String.valueOf(result.getOutputParameters().get('sessionId'));
                } else {                    
                    agentResponseWrapperObj.agentSessionId = agentSessionId;                    
                }                
            } else {                
                errorList = result.getErrors();
                agentResponseWrapperObj.isSuccess = false;
                agentResponseWrapperObj.value = errorList[0].getMessage();
            }
            system.debug('Agent response agentResponseWrapperObj : '+agentResponseWrapperObj);
            return agentResponseWrapperObj;
            
        } catch (Exception excep) {
            throw new AuraHandledException('An error occurred: ' + excep.getMessage());
        }
    }
}