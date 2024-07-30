import React from 'react';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';
//import './Selections.css';
import { APIgetMorphGroup } from '../APIurls';

const fetcher = (APIgetMorphGroup) => fetch(APIgetMorphGroup).then((res) => res.json());

export default function MorphGroup () {
	const { id: mgid } = useParams();

	const {
		data: morphGroupData,
		error: mgError,
		isValidating: mgIsValidating
	} = useSWR(APIgetMorphGroup+mgid, fetcher);

	if (mgError) return <div className="failed">failed to load</div>;
	if (mgIsValidating) return <div className="loading">Loading...</div>;

	return (
		<div>
			<h2>{morphGroupData.name}</h2>

			<p><b>language</b>: {morphGroupData.language}</p>
			<p>{morphGroupData.description}</p>
		</div>
	)

}
