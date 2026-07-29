import React from 'react';
import { apiUrl } from './config';

const APIloginToken = apiUrl('/api/login/access-token')
const APIgetArtifacts = apiUrl('/api/artifacts/')
const APIgetArtifactImageGrp = apiUrl('/api/images/groups/')
const APIgetArtifactContentSets = apiUrl('/api/content/sets/')
const APIgetImage = apiUrl('/api/images/')
const APIgetMorphGroup = apiUrl('/api/content/morphs/groups/')
const APIgetMorphOccurrences = apiUrl('/api/search/morphs/')
//const APIgetArtifactContentSources = ''

export {
    APIloginToken,
    APIgetArtifactImageGrp,
    APIgetArtifacts,
    APIgetArtifactContentSets,
    APIgetImage,
    APIgetMorphGroup,
	 APIgetMorphOccurrences
}
