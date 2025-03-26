import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import Id from '@salesforce/user/Id';
import getAgentActionMethod from '@salesforce/apex/AIAgentInvokerController.invokeAgentActionMethod';

export default class CaseDashboardLwc extends LightningElement {

    sobjectApiName;
    sobjectLabel;
    sobjectPlaceholder;
    displaySobjInfo;
    matchingSobjInfo;

    loginUserId = Id; //Current Login user Id
    caseByOwnerList;
    caseByContactList;
    welcomeMessage;
    selectedContactId;
    agentSessionId;
    userPrompt = '';
    loadingContactSpinner = false;
    loadingWelcomeSpinner = false;

    connectedCallback() {

        this.agentSessionId = null;
        this.loadingWelcomeSpinner = true;
        
        //Start - preparing data for contact record picker
        this.sobjectApiName = 'Contact';
        this.sobjectLabel = 'Contact';
        this.sobjectPlaceholder = 'Search Contact...';
        this.displayContactInfo = {
            primaryField: 'Name',
            additionalFields: ['Email'],
        };
        this.matchingContactInfo = {
            primaryField: { fieldPath: 'Name', mode: 'contains' },
            additionalFields: [{ fieldPath: 'Email'}],
        };
        //End

        this.userPrompt = `Generate welcome message and provide total number of cases that the owner ID ${this.loginUserId} has to work on.`;
        console.log('USER PROMPT: "'+this.userPrompt+'", SESSION ID: "'+this.agentSessionId+'"');

        /* Imperative Apex method call to fetch the welcome message and additional details from the agent  
        * based on the injected prompt.
        */
        getAgentActionMethod({userPrompt: this.userPrompt, agentSessionId: this.agentSessionId})
        .then(result => {
            if(result.isSuccess) {
                this.welcomeMessage = result.value;
                this.agentSessionId = result.agentSessionId;
                this.getCaseByOwnerListHandler();
            } else {
                this.showToast('Error',result.value,'error');
                this.loadingWelcomeSpinner = false;
            }
        })
        .catch(error => {
            this.showToast('Error',error,'error');
            this.loadingWelcomeSpinner = false;
        })
    }


    /**
    * Method to call an Apex function imperatively to invoke agent actions  
    * with a prompt to retrieve the list of cases assigned to the logged-in agent.
    */
    getCaseByOwnerListHandler() {

        this.userPrompt = `Provide list of all the new Cases assigned to owner Id ${this.loginUserId}`;
        console.log('USER PROMPT: "'+this.userPrompt+'", SESSION ID: "'+this.agentSessionId+'"');

        getAgentActionMethod({userPrompt: this.userPrompt, agentSessionId: this.agentSessionId})
        .then(result => {
            if(result.isSuccess) {
                this.caseByOwnerList = result.value; 
            } else {
                this.showToast('Error',result.value,'error');
            }
        })
        .catch(error => {
            this.showToast('Error',error,'error');
        })
        .finally(() => {
           this.loadingWelcomeSpinner = false;
        });
    }

    /**
    * Method to call an Apex function imperatively to invoke agent actions  
    * with a prompt to retrieve the list of cases related to the Contact selected by the agent on the UI.
    */
    onContactSelectionHandler(event) {

        this.selectedContactId = event.detail.recordId;
        this.caseByContactList = '';

        if(this.selectedContactId !== null) {

            this.loadingContactSpinner = true;
            
            this.userPrompt = `Provide list of all the new or escalated Cases assigned related to contact Id ${this.selectedContactId}`;
            console.log('USER PROMPT: "'+this.userPrompt+'", SESSION ID: "'+this.agentSessionId+'"');

            getAgentActionMethod({userPrompt: this.userPrompt, agentSessionId: this.agentSessionId})
            .then(result => {
                if(result.isSuccess) {
                    this.caseByContactList = result.value; 
                } else {
                    this.showToast('Error',result.value,'error');
                }
            })
            .catch(error => {
                this.showToast('Error',error,'error');
            })
            .finally(() => {
                this.loadingContactSpinner = false;
            });
       }
    }

    showToast(toastTitle,toastMessage,toastVariant){
        const event = new ShowToastEvent({
            title: toastTitle,
                message: toastMessage,
                    variant: toastVariant
                        });
        this.dispatchEvent(event);
    }
}