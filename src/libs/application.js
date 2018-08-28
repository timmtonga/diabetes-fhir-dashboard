//Global variables used in the application
var SMART;
var states = {}
var cellIndex = {'name': 0, 'age': 1, 'sex':2, 'admission':3, 'less than 70': 4, 'less than 250': 5, 'above 250':6,
    'a1c in last 3 months': 7, 'insulin ordered': 8}

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
    }
}

//This function takes in a patient state and adds a record to the dashboard table
function addPatientRow(id) {
    let curr_state = states[id]

    let row = document.createElement("tr")

    let nameCell = document.createElement("th")

    nameCell.style.textTransform = "capitalize"
    nameCell.innerHTML = curr_state.patient.name.toLowerCase()
    row.appendChild(nameCell)

    let ageCell = document.createElement("th")

    ageCell.innerHTML = curr_state.patient.age
    row.appendChild(ageCell)

    let genderCell = document.createElement("th")

    genderCell.style.textTransform = "capitalize"
    genderCell.innerHTML = curr_state.patient.gender
    row.appendChild(genderCell)

    let admissionCell = document.createElement("th")

    admissionCell.style.textTransform = "capitalize"
    admissionCell.innerHTML = '&nbsp;'
    row.appendChild(admissionCell)

    let seventyTwoHrsCell = document.createElement("th")

    seventyTwoHrsCell.style.textAlign = "center"
    seventyTwoHrsCell.innerHTML = "<strong>"+curr_state.glucoseCounts.below70_last72hrs + "</strong> <small>[" + curr_state.glucoseCounts.below70 + "]</small>"
    row.appendChild(seventyTwoHrsCell)

    let seventyTo250Cell = document.createElement("th")

    seventyTo250Cell.style.textAlign = "center"
    seventyTo250Cell.innerHTML = "<strong>"+curr_state.glucoseCounts.within70_250_last72hrs + "</strong> <small>[" + curr_state.glucoseCounts.within70_250+ "]</small>"
    row.appendChild(seventyTo250Cell)

    let above250Cell = document.createElement("th")

    above250Cell.style.textAlign = "center"
    above250Cell.innerHTML = "<strong>"+curr_state.glucoseCounts.above250_last72hrs + "</strong> <small>[" + curr_state.glucoseCounts.above250 + "]</small>"
    row.appendChild(above250Cell)

    let a1cCell = document.createElement("th")

    a1cCell.style.textAlign = "center"
    a1cCell.innerHTML = (curr_state.hasA1C ? curr_state.a1c : 'N/A')
    row.appendChild(a1cCell)

    let insulinOrderCell = document.createElement("th")

    insulinOrderCell.style.textAlign = "center"
    insulinOrderCell.innerHTML = (curr_state.insulinOrdered ? 'Yes' : 'No')
    row.appendChild(insulinOrderCell)

    let actionCell = document.createElement("th")
    let actionButton = document.createElement("button")

    actionButton.innerHTML = "View"
    actionButton.style.width = "99%"
    actionButton.setAttribute("class", "btn btn-primary")
    actionButton.setAttribute("id","btn-"+ curr_state['patient']['id']);
    actionButton.onmousedown = function () {
        //Toggle the visibility of the patient specific graph

        let button = document.getElementById("btn-"+ curr_state['patient']['id'])
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

    }

    actionCell.appendChild(actionButton)
    row.setAttribute("id", 'ptRow'+ curr_state['patient']['id'])
    row.appendChild(actionCell)

    $('#dev-table > tbody:last-child').append(row);

    let chartRow = document.createElement("tr")

    chartRow.style.display = "none"
    chartRow.setAttribute("id", 'row-'+ curr_state['patient']['id'])


    let chartCell = document.createElement("th")
    chartCell.colSpan = 10

    let chartContainer= document.createElement("div")

    chartContainer.style.minWidth = "95vw"
    chartContainer.style.height= "15vw"
    chartContainer.style.marginLeft= "auto"
    chartContainer.style.marginRight= "auto"
    chartContainer.setAttribute("id", 'chart-'+ curr_state['patient']['id'])
    chartCell.appendChild(chartContainer)
    chartRow.appendChild(chartCell)

    $('#dev-table > tbody:last-child').append(chartRow);
    addPatientChart(curr_state['patient']['id'])

}

//Function to create patient specific chart
function addPatientChart(patient_id) {
    Highcharts.chart('chart-'+patient_id, {
        chart: {
            type: 'spline',
            alignTicks: true
        },
        credits:false,
        title: {
            text: ''
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: {
                month: '%e %b',
                year: '%b'
            },
            title: {
                text: 'Date'
            }
        },
        yAxis: [{ // left y axis
            opposite: false,
            min: null,
            max: null,
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
            opposite: true,
            min: 0,
            max: 20,
            gridLineWidth: 1,
            title: {
                text: 'HbA1c %'
            },
            labels: {
                align: 'right',
                x: 3,
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
        series: [{
            name: "Glucose",
            type: "spline",
            data: states[patient_id].glucose_values
        }, {
            name: "HbA1c",
            type: "spline",
            yAxis: 1,
            data: states[patient_id].a1c_values
        }]
    });
}

//This function displays queried patient records in a table
function displayPatients(patients) {
    for(let i = 0; i < patients.length; i++)
    {
        let num_names = (patients[i].name.length - 1)
        let curr_name = patients[i].name[num_names].given.join(" ") + " " + patients[i].name[num_names].family
        let patientState = {
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
        getObs(patients[i].id, 'http://loinc.org|4548-4','patientA1C')
        getObs(patients[i].id, 'http://loinc.org|41653-7','patientGlcObs')
        getInsulinOrder(patients[i].id)
        addPatientRow(patients[i].id)
    }
}

//Parse retrieved glucose observations and update the dashboard records
function patientGlcObs(patient_id, observations) {
    let patient_max_date = 0

    //dates used to see which observations are the most recent
    for(let i = 0; i < observations.length; i++)
    {
        let curr_date = Date.parse(observations[i].effectiveDateTime);
        if (curr_date > patient_max_date){
            patient_max_date = curr_date
        }
    }

    for(let i = 0; i < observations.length; i++)
    {
        //Group the glucose observations depending on whether they happened within the last 72 hrs or not
        let curr_date = Date.parse(observations[i].effectiveDateTime);
        let within72hrs = curr_date > (patient_max_date - 259200000);
        if (observations[i].valueQuantity.value < 70){
            states[patient_id].glucoseCounts.below70 += 1
            if (within72hrs){
                states[patient_id].glucoseCounts.below70_last72hrs += 1
                $("#ptRow" + patient_id)[0].children[cellIndex['less than 70']].innerHTML = "<strong>"+
                    states[patient_id].glucoseCounts.below70_last72hrs +
                    "</strong> <small>[" + states[patient_id].glucoseCounts.below70 +"]</small>"
            }
        }else if (observations[i].valueQuantity.value > 250){
            states[patient_id].glucoseCounts.above250 += 1
            if (within72hrs){
                states[patient_id].glucoseCounts.above250_last72hrs += 1
                $("#ptRow" + patient_id)[0].children[cellIndex['above 250']].innerHTML = "<strong>"+
                    states[patient_id].glucoseCounts.above250_last72hrs +
                    "</strong> <small>[" + states[patient_id].glucoseCounts.above250 +"]</small>"
            }
        }else {
            states[patient_id].glucoseCounts.within70_250 += 1
            if (within72hrs){
                states[patient_id].glucoseCounts.within70_250_last72hrs += 1
                $("#ptRow" + patient_id)[0].children[cellIndex['less than 250']].innerHTML = "<strong>"+
                    states[patient_id].glucoseCounts.within70_250_last72hrs +
                    "</strong> <small>[" + states[patient_id].glucoseCounts.within70_250 +"]</small>"
            }
        }
        states[patient_id].glucose_values.push([Date.parse(observations[i].effectiveDateTime),observations[i].valueQuantity.value])
    }

    //refresh the chart to add new observations
    addPatientChart(patient_id)
}

//Function to process a1c values and update the dashboard
function patientA1C(patient_id, observations) {

    if (observations.length > 0)
    {
        states[patient_id].hasA1C = true
        states[patient_id].a1c = observations[0].valueQuantity.value
        document.getElementById("ptRow" + patient_id).cells[cellIndex['a1c in last 3 months']].innerHTML = states[patient_id].a1c
        for(let i=0; i < observations.length; i++)
        {
            states[patient_id].a1c_values.push([Date.parse(observations[i].effectiveDateTime),observations[i].valueQuantity.value])
        }
        //refresh the chart to add new observations
        addPatientChart(patient_id)
    }

}

//Function to get medication order need to add filter fo insulin
function getInsulinOrder(patient_id) {
    SMART.api.fetchAll({
        type: 'MedicationAdministration',
        query: {
            subject: "Patient/"+patient_id
        }
    }).then(function (obs) {

        if (obs.length > 0)
        {
            states[patient_id].insulinOrdered = true
            $("#ptRow" + patient_id)[0].children[cellIndex['insulin ordered']].innerHTML = 'Yes'
        }
    })
}

//Generic function to retrieve observations of a certain type
function getObs(patient_id, obs_code,parsingFunction) {
    var a = 'patientA1C'
    SMART.api.fetchAll({
        type: 'Observation',
        query: {
            code: obs_code,
            subject: "Patient/"+patient_id
        }
    }).then(function (obs) {
       window[parsingFunction](patient_id,obs);
    })
}

//Execution begins here
FHIR.oauth2.ready((fhirClient) => {
    SMART = fhirClient; //assigning the connection to a global persistent variable for future reuse

    //Initial query of all the patient records. Will add a filter fo currently admitted patients in production
   fhirClient.api.fetchAll({ type: "Patient" }).then(function(patients) {
        displayPatients(patients)
    });
})
