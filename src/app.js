/*Louisa Version*/
/*
let state = {
    patient: {},
    showPatientBanner: false,
    glucose: [],
    counts: [0, 0, 0],
}*/

let states = {}

var SMART;

const filter = {
    date: (date, format) => {
        return (new XDate(date)).toString(format)
      },
    age: (date) => {
        let yearNow = new Date().getYear()
        let monthNow = new Date().getMonth()
        let dateNow = new Date().getDate()

        let yearDob = new Date(date).getYear()
        let monthDob = new Date(date).getMonth()
        let dateDob = new Date(date).getDate()

        let yearAge = yearNow - yearDob
        let monthAge = null
        let dateAge = null

        if (monthNow >= monthDob) monthAge = monthNow - monthDob
        else {
            yearAge--
            monthAge = 12 + monthNow - monthDob
        }

        if (dateNow >= dateDob) dateAge = dateNow - dateDob
        else {
            monthAge--
            dateAge = 31 + dateNow - dateDob
            if (monthAge < 0) {
                monthAge = 11
                yearAge--
            }
        }

        return yearAge 
      },
    nameGivenFamily: (p) => {
        let isArrayName = p && p.name && p.name[0]
        let personName

        if (isArrayName) {
            personName = p && p.name && p.name[0]
            if (!personName) return null
        } else {
            personName = p && p.name
            if (!personName) return null
        }

        let user
        if (Object.prototype.toString.call(personName.family) === '[object Array]') {
            user = personName.given.join(" ") + " " + personName.family.join(" ")
        } else {
            user = personName.given.join(" ") + " " + personName.family
        }
        if (personName.suffix) {
            user = user + ", " + personName.suffix.join(", ")
        }
        return user
      },
}

function hours (observation, dob) {
    var hours = (new Date(observation).getTime() - new Date(dob).getTime()) / 36e5
    return (hours > 1000 || hours < -1000) ? "-----" : hours
}


function validateDate (date) {
    let newDate = new Date(date)
    if ( isNaN(newDate.getTime())) return false
    let ageHours = hours(newDate, state.patient.dob)
    return (0 <= ageHours && ageHours <=120)
}

function queryPatient (smart) {   
    let deferred = $.Deferred()
    $.when(smart.patient.read())
        .done((patient) => {
            state.patient.name = filter.nameGivenFamily(patient)

            // Check for the patient-birthTime Extension
            if (typeof patient.extension !== "undefined") {
                patient.extension.forEach((extension) => {
                    if (extension.url === "http://hl7.org/fhir/StructureDefinition/patient-birthTime") {
                        state.patient.dob = extension.valueDateTime
                    }
                })
            }
            // if dob wasn't set by the extension
            if (state.patient.dob === undefined) state.patient.dob = patient.birthDate

            state.patient.dob = new Date(state.patient.dob)
            state.patient.sex = patient.gender
            state.patient.id  = patient.id
            deferred.resolve()
        })
    return deferred
}


function queryGlucoseData (smart) {
    let deferred = $.Deferred()

    $.when(smart.patient.api.search({type: "Observation"}))
        .done((obsSearchResult) => {
            if (obsSearchResult.data.entry) {
                obsSearchResult.data.entry.forEach((obs) => {
                    if (obs.resource.code.coding[0].code == '41653-7'){
                        state.glucose.push(obs.resource.valueQuantity.value)
                        if (obs.resource.valueQuantity.value < 70){
                            state.counts[0]++
                        }else if (obs.resource.valueQuantity.value > 250){
                            state.counts[2]++
                        }else {
                            state.counts[1]++
                        }
                    }else{
                        console.log(state.patient.name + ' | ' + obs.resource.code.coding[0].display);
                    }
                })
            }
            deferred.resolve()
        }).fail(() => {deferred.resolve()})
    return deferred
}

function queryPatient2 (id) {   
    var patient = SMART.api.read({type: "Patient",id: id}).then(function(details){
        displayPatient(details)
    });
}

function queryGlucoseData2 (currpatient) {
    let deferred = $.Deferred()

    $.when(smart.patient.api.search({type: "Observation"}))
        .done((obsSearchResult) => {
            if (obsSearchResult.data.entry) {
                obsSearchResult.data.entry.forEach((obs) => {
                    if (obs.resource.code.coding[0].code == '41653-7'){
                        state.glucose.push(obs.resource.valueQuantity.value)
                        if (obs.resource.valueQuantity.value < 70){
                            state.counts[0]++
                        }else if (obs.resource.valueQuantity.value > 250){
                            state.counts[2]++
                        }else {
                            state.counts[1]++
                        }
                    }else{
                        console.log(state.patient.name + ' | ' + obs.resource.code.coding[0].display);
                    }
                })
            }
            deferred.resolve()
        }).fail(() => {deferred.resolve()})
    return deferred
}


function parse_glucose(curr_state, curr_val){
    if (curr_val < 70){
        curr_state.counts[0]++
    }else if (curr_val > 250){
        curr_state.counts[2]++
    }else {
        curr_state.counts[1]++
    }   
}

function display (curr_state) {
    new_row = '' +
    "<tr><th style='text-transform: capitalize'>"+curr_state.patient.name.toLowerCase()+'</th>'+
        '<th>'+curr_state.patient.age+'</th>'+
        "<th style='text-transform: capitalize'>"+curr_state.patient.gender+'</th>'+
        '<th>'+curr_state.counts[0]+'</th>'+
        '<th>'+curr_state.counts[1]+'</th>'+
        '<th>'+curr_state.counts[2]+'</th>'+
        '<th>n/a</th>'+
        '<th>n/a</th>'+
        "<th><button class= 'btn btn-primary' style='width:99%;' onmousedown='showPatient("+ curr_state['patient']['id'] +")'>View</button></th>"+
    '</tr>'

    $('#dev-table > tbody:last-child').append(new_row);    
}

if (1==0){
    FHIR.oauth2.ready((smart) => {
        state.showPatientBanner = !(smart.tokenResponse.need_patient_banner === false)
        queryPatient(smart).done(() => {
            queryGlucoseData(smart).done(() => {
                display(state.counts)
            })
        })
    })
}else{

    //This function displays all the patients in the database in a table
    function displayPatients(patients)
    {
        for(i = 0; i < patients.length; i++)
        {
            console.log('here')
            
            $.when(SMART.patient.api.search({type: "Observation"}))
                    .done((obsSearchResult) => {
                    console.log(obsSearchResult)
                    })

            queryPatient(SMART).done(() => {
            queryGlucoseData(SMART).done(() => {
                display(state.counts)
            })
        })
                    /*
            console.log('here')
            queryPatient(SMART).done(() => {
                queryGlucoseData(patients[i]).done(() => {
                    display(state.counts)
                })
            })
            console.log('there')
            num_names = (patients[i].name.length - 1)
            name = patients[i].name[num_names].given.join(" ") + " " + patients[i].name[num_names].family
            gender = patients[i].gender
            age = (filter.age(patients[i].birthDate))
            console.log(patients[i] )
        */
        }
    }
    
    //Execution begins here
    FHIR.oauth2.ready((fhirClient) => {
        SMART = fhirClient;
       fhirClient.api.fetchAll({ type: "Patient" }).then(function(patients) {
            
            for(i = 0; i < patients.length; i++)
            {   
                num_names = (patients[i].name.length - 1)
                curr_name = patients[i].name[num_names].given.join(" ") + " " + patients[i].name[num_names].family
                state = {
                    patient: {
                        name: curr_name,
                        id: patients[i].id,
                        gender: patients[i].gender,
                        age: (filter.age(patients[i].birthDate))
                    },
                    glucose: [],
                    counts: [0, 0, 0],
                }
                states['Patient/' + patients[i].id] = state
            }
        });

        fhirClient.api.fetchAll({ type: "Observation" }).then(function(observations) {
            for(i = 0; i < observations.length; i++)
            {   
                if (observations[i].code.coding[0].code == '41653-7'){
                   parse_glucose(states[observations[i].subject.reference], observations[i].valueQuantity.value)
             }else{
                console.log(observations[i])
             }
            }
            for (var key in states){
                display(states[key])
            }
        });
        

/*
        for(i = 0; i < states.length; i++)
        {
               console.log(states[i]);
        }*/
    })
}

