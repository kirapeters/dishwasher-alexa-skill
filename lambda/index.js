/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = `Welcome to my dishwasher.
            Are the dishes in your dishwasher dirty?`;
        const repromptText = 'Yes my dishes are dirty. What about your dishes?'

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptText)
            .getResponse();
    }
};

const VisitedAgainLaunchRequestHandler = {
    canHandle(handlerInput) {

        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};

        const areDishesDirty = sessionAttributes.hasOwnProperty('areDishesDirty') ? sessionAttributes.areDishesDirty : 0;

        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest'
            && areDishesDirty;
    },
    handle(handlerInput) {

        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};

        const areDishesDirty = sessionAttributes.hasOwnProperty('areDishesDirty') ? sessionAttributes.areDishesDirty : 0;
        console.log('visited again areDishesDirty: ' + areDishesDirty);

        let dishesStatus = '';
        let speakOutput = '';
        let speakOutputPlus = '';

        if (areDishesDirty === 'yes') {
            dishesStatus = 'dirty';
            speakOutputPlus = 'Are they still dirty?';
        } else if (areDishesDirty === 'no') {
            dishesStatus = 'clean';
            speakOutputPlus = 'Are they dirty now?';
        }
        speakOutput = 'Welcome back. I remember your dishes were ' + dishesStatus + ". " + speakOutputPlus;

        const repromptText = 'Yes or no.' + speakOutputPlus;

        if (dishesStatus === '') {
            speakOutput = 'Sorry, I did not understand. Please answer with yes or no.'
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptText)
            .getResponse();
    }
};

/**
 * This intent handles yes or no responses.
 */
const YesOrNoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'DishesStatusIntent';
    },
    async handle(handlerInput) {
        const yesOrNo = handlerInput.requestEnvelope.request.intent.slots.YesOrNo.resolutions.resolutionsPerAuthority[0].values[0].value.id;
        console.log('yes or no:' + yesOrNo);
        const attributesManager = handlerInput.attributesManager;

        const dishesStatus = {'areDishesDirty' : yesOrNo};

        attributesManager.setPersistentAttributes(dishesStatus);
        await attributesManager.savePersistentAttributes();
        
        let speakOutput = '';
        if (yesOrNo === 'yes') {
            speakOutput = 'Ok, I will say the dishes are dirty';
        } else if (yesOrNo === 'no') {
            speakOutput = 'Ok, I will say the dishes are clean';
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .withShouldEndSession(true)
            .getResponse();
    }
};

/**
 * If a yes or no is not detected, this intent will see if the user responded with clean or dirty.
 */
const CleanOrDirtyIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'CleanOrDirtyResponseIntent';
    },
    async handle(handlerInput) {
        const areOrAreNot = handlerInput.requestEnvelope.request.intent.slots.AreOrAreNot.resolutions.resolutionsPerAuthority[0].values[0].value.id;
        console.log('clean or dirty areDishesDirty: ' + areOrAreNot);
        const dirtyOrClean = handlerInput.requestEnvelope.request.intent.slots.DirtyOrClean.resolutions.resolutionsPerAuthority[0].values[0].value.id;
        const attributesManager = handlerInput.attributesManager;
        let areDishesDirty = '';
        let speakOutput = '';

        if ((areOrAreNot === 'are' && dirtyOrClean === 'dirty') || (areOrAreNot === 'areNot' && dirtyOrClean === 'clean')) {
            areDishesDirty = 'yes';
            speakOutput = "I'll remember the dishes are dirty";
        } else {
            areDishesDirty = 'no';
            speakOutput = "I'll remember the dishes are clean";
        }
        const dishesStatus = {'areDishesDirty' : areDishesDirty};

        attributesManager.setPersistentAttributes(dishesStatus);
        await attributesManager.savePersistentAttributes();

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .withShouldEndSession(true)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = `Set the status of your dishes by saying, tell my dishwasher my dishes are dirty?
            Ask me what the status of the dishes are by saying, ask my dishwasher if the dishes are dirty.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
                Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ignored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again or say exit';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const loadDishesStatus = {
    async process(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = await attributesManager.getPersistentAttributes() || {};

        const areDishesDirty = sessionAttributes.hasOwnProperty('areDishesDirty') ? sessionAttributes.areDishesDirty : 0;
        
        if (areDishesDirty) {
            attributesManager.setSessionAttributes(sessionAttributes);
        }
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .withPersistenceAdapter(
        new persistenceAdapter.S3PersistenceAdapter({bucketName:process.env.S3_PERSISTENCE_BUCKET})
        )
    .addRequestHandlers(
        VisitedAgainLaunchRequestHandler,
        LaunchRequestHandler,
        YesOrNoIntentHandler,
        CleanOrDirtyIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addRequestInterceptors(
        loadDishesStatus
    )
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();