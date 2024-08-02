import React from 'react';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';
//import './Selections.css';
import { APIgetMorphGroup, APIgetMorphOccurrences } from '../APIurls';
import './Morphs.css';

const MGfetcher = (APIgetMorphGroup) => fetch(APIgetMorphGroup).then((res) => res.json());
const MOfetcher = (APIgetMorphOccurrences) => fetch(APIgetMorphOccurrences).then((res) => res.json());


function MorphGroupHeader (props) {

	const morphGroupData = props.data;

	const MorphGroupHeader = () => (
		<div>
			<h2>{morphGroupData.name}</h2>

			<p><b>language</b>: {morphGroupData.language}</p>
			<p>{morphGroupData.description}</p>
		</div>
	)

	return <MorphGroupHeader/>
}


function MorphOccurrenceTokenType (props) {
	//console.log(props.type)
	return (
		<>
			{props.type.text}
		</>
	)
}

function MorphOccurrenceToken (props) {
	console.log(props.highlight, props.idx, props.token)
	let spanClasses;
	if (props.idx==props.highlight) {
		spanClasses="token highlighted";
	} else {
		spanClasses="token";
	}
	//if (props.highlight)
	return (
		<>
		<span className={spanClasses}>
		{props.token.types.map(type => (
			<>
			{type.type === 'original' ? <MorphOccurrenceTokenType type={type} /> : ""
			}
			</>
		))}
		</span>&nbsp;
		</>
	)
}

function MorphOccurrenceLine (props) {
	//console.log(props);
	return (
		<div className="morph-line">
		{props.line.tokens.map((token, idx) => (
			<MorphOccurrenceToken token={token} idx={idx} highlight={props.line.selected_token_index} />
		))}
		</div>
	)
}

function MorphOccurrences (props) {

/*	const morphOccurrence = morphOccurrences.map((imageList, imageListId) => (
		
	));

	return MorphOccurrences
	*/

	const morphOccurrenceData = props.data;
	//console.log(morphOccurrenceData);

/*	const MorphOccurrences = (
		{morphOccurrenceData.map(({line}, index) => (
		<MorphOccurrenceLine line={line} />
		))}
	);

	return <MorphOccurrences/>
	*/
	return (
		<>
		<h2>Occurrences</h2>
		{morphOccurrenceData.map(line => (
			<MorphOccurrenceLine line={line}/>
		))}
		</>
	);
}


export default function MorphGroup () {

	const { id: mgid } = useParams();

	const {
		data: morphGroupData,
		error: mgError,
		isValidating: mgIsValidating
	} = useSWR(APIgetMorphGroup+mgid, MGfetcher);


	const {
		data: morphOccurrenceData,
		error: moError,
		isValidating: moIsValidating
	} = useSWR(APIgetMorphOccurrences+mgid+"?window_span=5", MOfetcher);

	if (mgError || moError) return <div className="failed">failed to load</div>;
	if (mgIsValidating || moIsValidating) return <div className="loading">Loading...</div>;


	return (
		<>
		<MorphGroupHeader data={morphGroupData} />
		<MorphOccurrences data={morphOccurrenceData} />
		</>
	);

}
