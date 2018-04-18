var SMART;
var states = {}
// Get the modal

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

    let hours = (new Date().getTime() - new Date(date).getTime()) / 36e5
    if (dateAge > 1) hours = hours/(24 * dateAge)

    if ( (yearAge > 0) && (monthAge > 0) && (dateAge > 0) ) return yearAge + " yrs " //+ monthAge + " months"
    else if ( (yearAge > 0) && (monthAge > 0) && (dateAge == 0) ) return yearAge + " yrs" // + monthAge + " months"
    else if ( (yearAge > 0) && (monthAge == 0) && (dateAge > 0) ) return yearAge + " yrs" //+ dateAge + " days"
    else if ( (yearAge > 0) && (monthAge == 0) && (dateAge == 0) ) return yearAge + " yrs"
    else if ( (yearAge == 0) && (monthAge > 0) && (dateAge > 0) ) return monthAge + " mths " //+ dateAge + " days"
    else if ( (yearAge == 0) && (monthAge > 0) && (dateAge == 0) ) return monthAge + " mths"
    else if ( (yearAge == 0) && (monthAge == 0) && (dateAge > 1) ) return dateAge + " days"
    else if ( (yearAge == 0) && (monthAge == 0) && (dateAge > 0) ) return hours.toFixed(2) + " hrs"
    else return "Could not calculate age"
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

//This function displays a single patients demographic details
function displayPatient(response){

    var details = response.data // dealing with only the data portion of the response
    var num_names = (details.name.length - 1)
    var name = details.name[num_names].given.join(" ") + " " + details.name[num_names].family

    $('#name').text(name)
    $('#age').text((filter.age(details.birthDate)))
    $('#gender').text(details.gender)
}

//Query to show one patients information
function showPatient(id)
{
    button = document.getElementById("btn-"+id)
    if(button.innerHTML == "View")
    {
        button.innerHTML ="Hide";
        document.getElementById("row-"+id).style.display = "block";
    }
    else
    {
        button.innerHTML = "View"
        document.getElementById("row-"+id).style.display = "None";
    }

    /*
    var patient = SMART.api.read({type: "Patient",id: id}).then(function(details){
        displayPatient(details)

    });*/
}

function parseGlucose( observations, id ){

    for(i = 0; i < observations.length; i++)
    {
        if (observations[i].valueQuantity.value < 70){
            states[id].glucoseCounts.below70 += 1
        }else if (observations[i].valueQuantity.value > 250){
            states[id].glucoseCounts.above250 += 1
        }else {
            states[id].glucoseCounts.within70_250 += 1
        }
    }
    addPatientRow(id)
}

//This function displays all the patients in the database in a table
function displayPatients(patients)
{
    for(i = 0; i < patients.length; i++)
    {
        num_names = (patients[i].name.length - 1)
        curr_name = patients[i].name[num_names].given.join(" ") + " " + patients[i].name[num_names].family
        patientState = {
            patient: {
                name: curr_name,
                id: patients[i].id,
                gender: patients[i].gender,
                age: (filter.age(patients[i].birthDate))
            },
            glucoseCounts: {below70: 0,within70_250: 0,above250:0},
            hasA1C: false
        }

        states[patients[i].id] = patientState
        getPatientA1C(patients[i].id, 'http://loinc.org|4548-4')
        getPatientGlcObs(patients[i].id, 'http://loinc.org|41653-7')

    }
}

//This function takes in a patient state and adds a record to the table
function addPatientRow(id)
{
    curr_state = states[id]
    new_row = '' +
        "<tr><th style='text-transform: capitalize'>"+curr_state.patient.name.toLowerCase()+'</th>'+
        '<th>'+curr_state.patient.age+'</th>'+
        "<th style='text-transform: capitalize'>"+curr_state.patient.gender+'</th>'+
        "<th style='text-transform: capitalize'>&nbsp;</th>"+
        "<th>"+curr_state.glucoseCounts.below70 +"</th>"+
        "<th>"+curr_state.glucoseCounts.within70_250+"</th>"+
        "<th>"+curr_state.glucoseCounts.above250 +"</th>"+
        "<th>" + (curr_state.hasA1C ? 'Yes' : 'No') + "</th>"+
        '<th>n/a</th>'+
        "<th><button class= 'btn btn-primary' style='width:99%;' id='btn-"+ curr_state['patient']['id'] +
        "' onmousedown='showPatient("+ curr_state['patient']['id'] +")'>View</button></th>"+
        '</tr>'

    $('#dev-table > tbody:last-child').append(new_row);
    chart_row = '' +
        "<tr id='row-"+ curr_state['patient']['id'] +"' style='display: none;' colspan='10'><td>I am here</td></td></tr>"
    $('#dev-table > tbody:last-child').append(chart_row);

}

//Function to query specific observations
function getPatientGlcObs(patient_id, obs_code) {

    SMART.api.fetchAll({
        type: 'Observation',
        query: {
            code: obs_code
                /*
                {
                $or: ['http://loinc.org|41653-7', 'http://loinc.org|8462-4',
                    'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                    'http://loinc.org|2089-1', 'http://loinc.org|55284-4']}*/
            ,
            subject: "Patient/"+patient_id
        }
    }).then(function (obs) {
         parseGlucose(obs, patient_id)
    })

}

function getPatientA1C(patient_id, obs_code) {

    var d = new Date();
    d.setMonth(d.getMonth() - 3);

    SMART.api.fetchAll({
        type: 'Observation',
        query: {
            code: obs_code
            /*
            {
            $gte
            $or: ['http://loinc.org|41653-7', 'http://loinc.org|8462-4',
                'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                'http://loinc.org|2089-1', 'http://loinc.org|55284-4']}*/
            ,
            subject: "Patient/"+patient_id
        }
    }).then(function (obs) {
        if (obs.length > 0)
        {
            states[patient_id].hasA1C = true
        }
    })

}


//Execution begins here
FHIR.oauth2.ready((fhirClient) => {
    SMART = fhirClient;
   fhirClient.api.fetchAll({ type: "Patient" }).then(function(patients) {
        displayPatients(patients)
    });
})
