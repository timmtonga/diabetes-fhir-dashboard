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

    if ( (yearAge > 0) && (monthAge > 0) && (dateAge > 0) ) return yearAge  //+ monthAge + " months"
    else if ( (yearAge > 0) && (monthAge > 0) && (dateAge == 0) ) return yearAge  // + monthAge + " months"
    else if ( (yearAge > 0) && (monthAge == 0) && (dateAge > 0) ) return yearAge //+ dateAge + " days"
    else if ( (yearAge > 0) && (monthAge == 0) && (dateAge == 0) ) return yearAge 
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
        document.getElementById("row-"+id).style.display = "";
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
    let patient_max_date = 0
    for(i = 0; i < observations.length; i++)
    {
        let curr_date = Date.parse(observations[i].effectiveDateTime);
        if (curr_date > patient_max_date){
            patient_max_date = curr_date
        }
    }

    for(i = 0; i < observations.length; i++)
    {
        let curr_date = Date.parse(observations[i].effectiveDateTime);
        let within72hrs = curr_date > (patient_max_date - 259200000);
        if (observations[i].valueQuantity.value < 70){
            states[id].glucoseCounts.below70 += 1
            if (within72hrs){
               states[id].glucoseCounts.below70_last72hrs += 1 
            }
        }else if (observations[i].valueQuantity.value > 250){
            states[id].glucoseCounts.above250 += 1
            if (within72hrs){
               states[id].glucoseCounts.above250_last72hrs += 1 
            }
        }else {
            states[id].glucoseCounts.within70_250 += 1
            if (within72hrs){
               states[id].glucoseCounts.within70_250_last72hrs += 1 
            }
        }
        states[id].glucose_values.push([Date.parse(observations[i].effectiveDateTime),observations[i].valueQuantity.value])
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
            glucoseCounts: {below70: 0,within70_250: 0,above250:0, below70_last72hrs: 0,within70_250_last72hrs: 0,above250_last72hrs:0},
            hasA1C: false,
            a1c: 0,
            a1c_values: [],
            glucose_values: [],
            insulinOrdered: false
        }

        states[patients[i].id] = patientState
        getPatientA1C(patients[i].id, 'http://loinc.org|4548-4')
        getInsulinOrder(patients[i].id, 'http://snomed.info/sct|263887005')
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
        "<th style='text-align: center;'><strong>"+curr_state.glucoseCounts.below70_last72hrs + "</strong> <small>[" + curr_state.glucoseCounts.below70 + "]</small></th>"+
        "<th style='text-align: center;'><strong>"+curr_state.glucoseCounts.within70_250_last72hrs + "</strong> <small>[" + curr_state.glucoseCounts.within70_250+ "]</small></th>"+
        "<th style='text-align: center;'><strong>"+curr_state.glucoseCounts.above250_last72hrs + "</strong> <small>[" + curr_state.glucoseCounts.above250 + "]</small></th>"+

        "<th style='text-align: center;'>" + (curr_state.hasA1C ? curr_state.a1c : 'N/A') + "</th>"+
        "<th style='text-align: center;'>" + (curr_state.insulinOrdered ? 'Yes' : 'No') + "</th>"+
        "<th><button class= 'btn btn-primary' style='width:99%;' id='btn-"+ curr_state['patient']['id'] +
        "' onmousedown='showPatient("+ curr_state['patient']['id'] +")'>View</button></th>"+
        '</tr>'

    $('#dev-table > tbody:last-child').append(new_row);
    chart_row = '' +
        "<tr id='row-"+ curr_state['patient']['id'] +"' style='display: none;'><th colspan=10>"+
        "<div id='chart-"+ curr_state['patient']['id'] +"' style='min-width: 95vw; height: 15vw; margin-right:auto;margin-left: auto;'></div>"
        "</th><th>&nbsp;</th></tr>"
    $('#dev-table > tbody:last-child').append(chart_row);
    addChart(curr_state['patient']['id'])

}

//Function to create charts
function addChart(patient_id) {
    Highcharts.chart('chart-'+patient_id, {
        chart: {
            type: 'spline'
        },
        credits:false,
        title: {
            text: ''
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: { // don't display the dummy year
                month: '%e %b',
                year: '%b'
            },
            title: {
                text: 'Date'
            }
        },
        yAxis: [{ // left y axis
            title: {
                text: 'Glucose mg/dL'
            },
            labels: {
                align: 'left',
                x: 3,
                y: 16,
                format: '{value:.,0f}'
            },
            showFirstLabel: false
        }, { // right y axis
            linkedTo: 0,
            gridLineWidth: 0,
            opposite: true,
            title: {
                text: 'HbA1c %'
            },
            labels: {
                align: 'right',
                x: -3,
                y: 16,
                format: '{value:.,0f}'
            },
            showFirstLabel: false
        }],
        tooltip: {
            headerFormat: '<b>{series.name}</b><br>',
            pointFormat: '{point.x:%e %b}: {point.y:.2f}'
        },

        plotOptions: {
            spline: {
                marker: {
                    enabled: true
                }
            }
        },

        colors: ['#6CF', '#036', '#000'],

        // Define the data points. All series have a dummy year
        // of 1970/71 in order to be compared on the same x axis. Note
        // that in JavaScript, months start at 0 for January, 1 for February etc.
        series: [{
            name: "Glucose",
            data: states[patient_id].glucose_values
        }, {
            name: "HbA1c",
            data: states[patient_id].a1c_values
        }]
    });
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
            states[patient_id].a1c = obs[0].valueQuantity.value
            for(i=0; i < obs.length; i++)
            {
                states[patient_id].a1c_values.push([Date.parse(obs[i].effectiveDateTime),obs[i].valueQuantity.value])
            }
        }
    })

}

function getInsulinOrder(patient_id, obs_code) {

    SMART.api.fetchAll({
        type: 'MedicationAdministration',
        query: {

            /*
            {
            $gte
            $or: ['http://loinc.org|41653-7', 'http://loinc.org|8462-4',
                'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                'http://loinc.org|2089-1', 'http://loinc.org|55284-4']}*/
            
            subject: "Patient/"+patient_id
        }
    }).then(function (obs) {

        if (obs.length > 0)
        {
            states[patient_id].insulinOrdered = true

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
