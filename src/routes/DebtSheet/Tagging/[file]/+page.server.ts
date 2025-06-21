async function load() {
    try {
        let storedData = sessionStorage.getItem('currentFile');
        let currentFile = JSON.parse(storedData);
        const response = await fetch('http://localhost:5000/analyze_tags', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: currentFile.filename,
                tag_column: 'Tags',
                tag_type_column: 'Tag Type'
            })
        });

        if (!response.ok) {
            console.log('error fetching data: ', error);
        }

        const data = await response.json();
        tagGroups = data.tag_groups;
        return data;
    } catch (error) {
        console.log('error fetching data: ', error);
    }
}