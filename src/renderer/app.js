import { Observer } from 'mobx-react';
import DockerService from './docker';
import ReactDOM from 'react-dom';

if (module.hot) {
    module.hot.accept();
}

const App = ({ docker }) => (
    <div>
        Docker Containers List:
        <ContainersList containers={docker.containers} />
    </div>
);

const ContainersList = ({ containers }) =>
    <Observer render={() =>
        <pre>{JSON.stringify(containers, null, 2)}</pre>
    } />;

ReactDOM.render(
    <App
        docker={new DockerService}
    />,
    document.getElementById('app')
);
