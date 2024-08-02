import React from 'react';

const APIloginToken = 'http://localhost:8000/api/login/access-token'
const APIgetArtifacts = 'http://localhost:8000/api/artifacts/'
const APIgetArtifactImageGrp = 'http://localhost:8000/api/images/groups/'
const APIgetArtifactContentSets = 'http://localhost:8000/api/content/sets/'
const APIgetImage = 'http://localhost:8000/api/images/'
const APIgetMorphGroup = 'http://localhost:8000/api/content/morphs/groups/'
const APIgetMorphOccurrences = 'http://localhost:8000/api/search/morphs/'
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
