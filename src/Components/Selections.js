import React from 'react';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';
import './Selections.css';
import { APIgetImage } from '../APIurls';

function SelectionRect({ top, left, width, height }) {
    top = top * 100 + "%";
    left = left * 100 + "%";
    width = width * 100 + "%";
    height = height * 100 + "%";

    const rectStyle = {
        top: top,
        left: left,
        width: width,
        height: height
    };
    return (
        <div class="selection"
            style={rectStyle}
        ></div>
    );
}

const fetcher = (APIgetImage) => fetch(APIgetImage).then((res) => res.json());

export default function Selection () {
    const { id: image } = useParams();

    const {
        data: imageData,
        error: imageError, isValidating: imageIsValidating
    } = useSWR(APIgetImage+image, fetcher);

    const {
        data: selectionData,
        error: selectionError, isValidating: selectionIsValidating
    } = useSWR(APIgetImage+image+"/selections", fetcher);

    if (imageError) return <div className="failed">failed to load</div>;
    if (imageIsValidating) return <div className="loading">Loading...</div>;
    if (selectionError) return <div className="failed">failed to load</div>;
    if (selectionIsValidating) return <div className="loading">Loading...</div>;

    const selections = [];
    for (let i = 0; i < selectionData.length; i++) {
        selections.push(SelectionRect({
            top: selectionData[i].top,
            left: selectionData[i].left,
            width: selectionData[i].width,
            height: selectionData[i].height
        }))
    }

    return (
        <div class="selectedImage" id="selectedImage">
            <img class="selectedImageImage" src={APIgetImage+imageData.uri} />
            {selections}
        </div>
    );
}
