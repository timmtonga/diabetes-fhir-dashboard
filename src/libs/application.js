let state = {
    patient: {},
}
let smart_local = {};
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

    if ( (yearAge > 0) && (monthAge > 0) && (dateAge > 0) ) return yearAge + "y " + monthAge + "m " + dateAge + "d"
    else if ( (yearAge > 0) && (monthAge > 0) && (dateAge == 0) ) return yearAge + "y " + monthAge + "m"
    else if ( (yearAge > 0) && (monthAge == 0) && (dateAge > 0) ) return yearAge + "y " + dateAge + "d"
    else if ( (yearAge > 0) && (monthAge == 0) && (dateAge == 0) ) return yearAge + "y"
    else if ( (yearAge == 0) && (monthAge > 0) && (dateAge > 0) ) return monthAge + "m " + dateAge + "d"
    else if ( (yearAge == 0) && (monthAge > 0) && (dateAge == 0) ) return monthAge + "m"
    else if ( (yearAge == 0) && (monthAge == 0) && (dateAge > 1) ) return dateAge + "d"
    else if ( (yearAge == 0) && (monthAge == 0) && (dateAge > 0) ) return hours.toFixed(2) + "h"
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

function displayPatient(){
    $('#name').text(state.patient.name)
    $('#age').text(state.patient.name)
    $('#gender').text(state.patient.sex)
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

function getAllPatients() {

    $.get( "https://api-v5-stu3.hspconsortium.org/dmDBMI/open/Patient/", function( data ) {
        state.patients = data.entry;
        displayPatients();
    });
}

function displayPatients()
{
    for(i = 0; i < state.patients.length; i++)
    {
        num_names = (state.patients[i].resource.name.length - 1)
        name = state.patients[i].resource.name[num_names].given.join(" ") + " " + state.patients[i].resource.name[num_names].family
        gender = state.patients[i].resource.gender
        age = (filter.age(state.patients[i].resource.birthDate))
        $("#patientsTable > tbody").append("<tr><td>"+name+"</td><td>"+age+"</td><td>"+gender+"</td>" +
            "<td style='text-align: center'><button class= 'btn btn-primary' onmousedown='showPatient("+ state.patients[i].resource.id +")'>View</button></td></tr>");
    }
}

function showPatient(id)
{
    console.log("Querying patient")
    smart_local.patient.id = id
    queryPatient(smart_local).done(() => {
        displayPatient()
    })
}

FHIR.oauth2.ready((smart) => {
    smart_local = smart;
    getAllPatients();
    /*
    queryPatient(smart).done(() => {
        displayPatient()
})*/
})

/*
(function(){
    'use strict';
    var $ = jQuery;
    $.fn.extend({
        filterTable: function(){
            return this.each(function(){
                $(this).on('keyup', function(e){
                    $('.filterTable_no_results').remove();
                    var $this = $(this),
                        search = $this.val().toLowerCase(),
                        target = $this.attr('data-filters'),
                        $target = $(target),
                        $rows = $target.find('tbody tr');

                    if(search == '') {
                        $rows.show();
                    } else {
                        $rows.each(function(){
                            var $this = $(this);
                            $this.text().toLowerCase().indexOf(search) === -1 ? $this.hide() : $this.show();
                        })
                        if($target.find('tbody tr:visible').size() === 0) {
                            var col_count = $target.find('tr').first().find('td').size();
                            var no_results = $('<tr class="filterTable_no_results"><td colspan="'+col_count+'">No results found</td></tr>')
                            $target.find('tbody').append(no_results);
                        }
                    }
                });
            });
        }
    });
    $('[data-action="filter"]').filterTable();
})(jQuery);

$(function(){
    // attach table filter plugin to inputs
    $('[data-action="filter"]').filterTable();

    $('.container').on('click', '.panel-heading span.filter', function(e){
        var $this = $(this),
            $panel = $this.parents('.panel');

        $panel.find('.panel-body').slideToggle();
        if($this.css('display') != 'none') {
            $panel.find('.panel-body input').focus();
        }
    });

})*/